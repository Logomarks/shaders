/**
 * A pretend browser for the runner's tests: canvases, a WebGL 2 context
 * that records its calls, an IntersectionObserver the test moves things in
 * and out of view with, animation frames the test runs by hand, the tab's
 * visibility, reduced motion and the pointer. Enough of each for the
 * runner's lifecycle, nothing more.
 */

/** GL constants the runner reads; any distinct numbers do. */
const CONSTANTS = { VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, ARRAY_BUFFER: 5, STATIC_DRAW: 6, FLOAT: 7, TRIANGLES: 8, MAX_VIEWPORT_DIMS: 9 };

/**
 * A WebGL 2 context that records every call.
 *
 * @param {{ failCompile?: boolean }} [options] Make shaders fail to compile.
 * @returns {Record<string, any> & { calls: any[][], lost: boolean }} The context.
 */
export function fakeGl({ failCompile = false } = {}) {
	const state = { calls: /** @type {any[][]} */ ([]), lost: false };
	/** @type {Record<string, (...a: any[]) => any>} */
	const answers = {
		createShader: () => ({}),
		createProgram: () => ({}),
		createBuffer: () => ({}),
		getShaderParameter: () => !failCompile,
		getShaderInfoLog: () => "ERROR: 0:12: 'heigt' : no matching overloaded function found",
		getProgramParameter: () => true,
		isContextLost: () => state.lost,
		getUniformLocation: (_p, name) => name,
		getParameter: (k) => (k === CONSTANTS.MAX_VIEWPORT_DIMS ? [4096, 4096] : 0),
		getExtension: (name) =>
			name === 'WEBGL_lose_context'
				? {
						loseContext: () => {
							state.lost = true;
							state.calls.push(['loseContext']);
						},
					}
				: null,
	};
	return new Proxy(Object.assign(state, CONSTANTS), {
		get(target, key) {
			if (key in target) return /** @type {any} */ (target)[key];
			return (/** @type {any[]} */ ...args) => {
				target.calls.push([key, ...args]);
				return answers[/** @type {string} */ (key)]?.(...args);
			};
		},
	});
}

/** A minimal event target. */
class Target {
	/** @type {Map<string, Set<Function>>} */
	listeners = new Map();
	/** @param {string} type @param {Function} fn */
	addEventListener(type, fn) {
		if (!this.listeners.has(type)) this.listeners.set(type, new Set());
		this.listeners.get(type)?.add(fn);
	}
	/** @param {string} type @param {Function} fn */
	removeEventListener(type, fn) {
		this.listeners.get(type)?.delete(fn);
	}
	/** @param {string} type @param {object} [event] */
	dispatch(type, event = {}) {
		for (const fn of [...(this.listeners.get(type) ?? [])]) fn({ type, ...event });
	}
}

/**
 * Installs the pretend browser on globalThis.
 *
 * @param {{ reducedMotion?: boolean, noWebGl?: boolean, failCompile?: boolean, observer?: boolean }} [options] How it behaves.
 * @returns {any} Handles on it, and `uninstall()`.
 */
export function install({ reducedMotion = false, noWebGl = false, failCompile = false, observer = true } = {}) {
	const env = {
		/** Every context made, in order. */
		contexts: /** @type {ReturnType<typeof fakeGl>[]} */ ([]),
		/** Queued animation frames. */
		frames: /** @type {Map<number, (now: number) => void>} */ (new Map()),
		nextFrame: 1,
		now: 0,
		/** @type {any[]} */
		observers: [],
		document: new (class extends Target {
			hidden = false;
			/** @param {string} tag */
			createElement(tag) {
				if (tag !== 'canvas') throw new Error(tag);
				return new FakeCanvas();
			}
		})(),
		window: new Target(),
		/** Runs the queued frames, `ms` after the last. @param {number} [ms] */
		tick(ms = 1000 / 60) {
			env.now += ms;
			const due = [...env.frames.values()];
			env.frames.clear();
			due.forEach((fn) => fn(env.now));
		},
		/** Moves an element into or out of view. @param {any} el @param {boolean} near */
		view(el, near) {
			for (const o of env.observers) if (o.targets.has(el)) o.callback([{ target: el, isIntersecting: near }]);
		},
		/** The draws a context made, as their uTime values. @param {any} gl */
		times(gl) {
			return gl.calls.filter((/** @type {any[]} */ c) => c[0] === 'uniform1f' && c[1] === 'uTime').map((/** @type {any[]} */ c) => c[2]);
		},
		uninstall() {
			for (const k of Object.keys(saved)) {
				if (saved[k] === undefined) delete (/** @type {any} */ (globalThis))[k];
				else (/** @type {any} */ (globalThis))[k] = saved[k];
			}
		},
	};

	/** A canvas: a context on demand, attributes, a parent to be swapped out of. */
	class FakeCanvas extends Target {
		tagName = 'CANVAS';
		width = 300;
		height = 150;
		clientWidth = 400;
		clientHeight = 500;
		style = { cssText: '' };
		/** @type {Map<string, string>} */
		attrs = new Map();
		/** @type {any} */
		parent = null;
		/** @type {ReturnType<typeof fakeGl> | null} */
		gl = null;
		getContext() {
			if (noWebGl) return null;
			if (!this.gl) {
				this.gl = fakeGl({ failCompile });
				env.contexts.push(this.gl);
			}
			return this.gl;
		}
		/** @param {string} k @param {string} v */
		setAttribute(k, v) {
			this.attrs.set(k, v);
		}
		/** @param {string} k */
		removeAttribute(k) {
			this.attrs.delete(k);
		}
		/** @param {string} k */
		hasAttribute(k) {
			return this.attrs.has(k);
		}
		cloneNode() {
			const c = new FakeCanvas();
			c.attrs = new Map(this.attrs);
			Object.assign(c, { width: this.width, height: this.height, clientWidth: this.clientWidth, clientHeight: this.clientHeight });
			return c;
		}
		/** @param {any} next */
		replaceWith(next) {
			if (!this.parent) return;
			const i = this.parent.children.indexOf(this);
			this.parent.children[i] = next;
			next.parent = this.parent;
			this.parent = null;
		}
		remove() {
			if (!this.parent) return;
			this.parent.children.splice(this.parent.children.indexOf(this), 1);
			this.parent = null;
		}
		get isConnected() {
			return Boolean(this.parent);
		}
		getBoundingClientRect() {
			return { left: 0, top: 0, width: 400, height: 500 };
		}
	}

	/** An element that holds canvases. */
	class FakeElement extends Target {
		tagName = 'DIV';
		/** @type {any[]} */
		children = [];
		/** @param {any} child */
		appendChild(child) {
			child.parent = this;
			this.children.push(child);
			return child;
		}
	}

	const saved = /** @type {Record<string, any>} */ ({});
	/** @param {string} k @param {any} v */
	const set = (k, v) => {
		saved[k] = /** @type {any} */ (globalThis)[k];
		/** @type {any} */ (globalThis)[k] = v;
	};
	set('document', env.document);
	set('window', env.window);
	set('devicePixelRatio', 2);
	set('matchMedia', (/** @type {string} */ q) => ({ matches: q.includes('reduced-motion') && reducedMotion }));
	set('requestAnimationFrame', (/** @type {(now: number) => void} */ fn) => {
		const id = env.nextFrame++;
		env.frames.set(id, fn);
		return id;
	});
	set('cancelAnimationFrame', (/** @type {number} */ id) => env.frames.delete(id));
	set('ResizeObserver', class {
		observe() {}
		unobserve() {}
		disconnect() {}
	});
	set(
		'IntersectionObserver',
		observer
			? class {
					/** @param {Function} callback @param {object} options */
					constructor(callback, options) {
						this.callback = callback;
						this.options = options;
						this.targets = new Set();
						env.observers.push(this);
					}
					/** @param {any} el */
					observe(el) {
						this.targets.add(el);
					}
					/** @param {any} el */
					unobserve(el) {
						this.targets.delete(el);
					}
					disconnect() {
						this.targets.clear();
					}
				}
			: undefined,
	);
	Object.assign(env, { FakeCanvas, FakeElement });
	return /** @type {any} */ (env);
}
