/**
 * @module @arraypress/shaders/runtime/lifecycle
 *
 * A scene's lazy WebGL context. A browser keeps about sixteen contexts and
 * drops the oldest past that, so a page of scenes must give them back: a
 * context is made when the canvas comes within a margin of the screen
 * (`200px`, or `lazy` as a CSS length) and given back four seconds after
 * it leaves. A canvas whose context was given back can't get another, so
 * a fresh canvas takes its place each time; the canvas holding a context
 * has a `data-gl` attribute. When the browser takes the context, the next
 * start is on a fresh canvas too. Without WebGL 2, or when the shader
 * fails (warned once), it stops trying.
 */

import { CONTEXT, compile, loseContext } from './gl.js';

/**
 * @typedef {import('./lifecycle.js').LazyContext} LazyContext
 * @typedef {import('./lifecycle.js').LifecycleHooks} LifecycleHooks
 * @typedef {import('./gl.js').Program} Program
 */

/** How long a lazy scene keeps its context after leaving the screen, ms. */
export const AWAY_MS = 4000;

/**
 * A canvas's lazy context.
 *
 * @param {HTMLCanvasElement} first The canvas to start on.
 * @param {import('../types.js').SceneDefinition} def The scene.
 * @param {LifecycleHooks} hooks What it tells the scene.
 * @returns {LazyContext} The context's holder.
 */
export function lazyContext(first, def, hooks) {
	let canvas = first;
	/** @type {{ gl: WebGL2RenderingContext, prog: Program } | null} */
	let held = null;
	let lost = false; // the browser took the context
	let broken = false; // no WebGL 2, or the shader failed: stop trying
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let away;

	const io =
		typeof IntersectionObserver === 'undefined'
			? null
			: new IntersectionObserver((entries) => entries.forEach((e) => e.target === canvas && hooks.onNear(e.isIntersecting)), { rootMargin: `${hooks.margin} 0px` });
	// a still (or paused) scene redraws when its size changes
	const resizer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => hooks.onResize());
	io?.observe(canvas);
	resizer?.observe(canvas);

	/** @returns {boolean} Whether it holds a context now, made on the current canvas. */
	const acquire = () => {
		if (held) return true;
		if (broken) return false;
		const gl = /** @type {WebGL2RenderingContext | null} */ (canvas.getContext('webgl2', CONTEXT));
		if (!gl) {
			broken = true;
			return false;
		}
		try {
			held = { gl, prog: compile(gl, def.fragment) };
		} catch (error) {
			broken = true;
			console.warn('[@arraypress/shaders]', def.name, /** @type {Error} */ (error).message);
			loseContext(gl);
			return false;
		}
		canvas.setAttribute('data-gl', ''); // (marks a canvas holding a context: handy to check none linger)
		const on = canvas;
		on.addEventListener(
			'webglcontextlost',
			() => {
				if (canvas !== on) return;
				held = null;
				lost = true;
				hooks.onLost();
			},
			{ once: true },
		);
		hooks.onReady(held.gl, held.prog);
		return true;
	};

	/** Gives the context back, and puts a fresh canvas in this one's place for next time. */
	const release = () => {
		clearTimeout(away);
		hooks.onRelease();
		if (!held && !lost) return;
		loseContext(held?.gl);
		held = null;
		lost = false;
		const fresh = /** @type {HTMLCanvasElement} */ (canvas.cloneNode(false));
		fresh.removeAttribute('data-gl');
		io?.unobserve(canvas);
		resizer?.unobserve(canvas);
		canvas.replaceWith(fresh);
		canvas = fresh;
		io?.observe(canvas);
		resizer?.observe(canvas);
	};

	return {
		get canvas() {
			return canvas;
		},
		get held() {
			return held;
		},
		observing: io !== null,
		acquire,
		release,
		ensure() {
			if (held) return true;
			if (lost) release(); // the browser took it: start again on a fresh canvas
			return acquire();
		},
		leaveSoon() {
			clearTimeout(away);
			away = setTimeout(release, AWAY_MS);
		},
		stay() {
			clearTimeout(away);
		},
		dispose(own) {
			clearTimeout(away);
			io?.disconnect();
			resizer?.disconnect();
			if (held) {
				// A canvas still on the page may be handed to another scene (as React's strict mode does):
				// keep its context for that, freeing only this scene's program. Otherwise give it back now.
				if (own || !canvas.isConnected) loseContext(held.gl);
				else {
					held.gl.deleteProgram(held.prog.program);
					held.gl.deleteBuffer(held.prog.buffer);
				}
			}
			held = null;
			if (own) canvas.remove();
		},
	};
}
