/**
 * @module @arraypress/shaders/core
 *
 * The engine under every scene, without any scene's shader: it runs a
 * scene definition (a module from `@arraypress/shaders/<name>`, or one of
 * your own made with `define`) on a canvas, renders stills off screen, and
 * turns options into the uniforms the shaders read.
 *
 * A running scene is as cheap as it can look right:
 *
 * - It holds a WebGL context only while it is near the screen, and gives
 *   it back four seconds after it leaves (a browser keeps about sixteen
 *   contexts and drops the oldest past that, so a page of scenes must give
 *   them back). A canvas whose context was given back cannot have another,
 *   so a fresh canvas takes its place each time.
 * - It draws only while near the screen and the tab is visible.
 * - It draws at a share of the screen's resolution (the scene's `scale`,
 *   never above one device pixel per CSS pixel): soft pictures lose
 *   nothing when the browser scales them up. Weak devices (four cores or
 *   fewer, 4 GB or less, data saver) start at three quarters of that, and
 *   when frames come late the resolution steps down, to `minScale`.
 * - It draws `fps` frames a second (30: these move slowly), not the
 *   screen's 60 or 120.
 * - With prefers-reduced-motion, it draws one frame and stops.
 *
 * Nothing here touches the DOM until a scene is started, so it imports
 * safely in Node (for the option and uniform helpers) and during server
 * rendering.
 */

import { HEX } from './define.js';

export { define, MAX_PARAMS } from './define.js';
export { HEAD } from './head.js';

/**
 * @typedef {import('./core.js').SceneDefinition} SceneDefinition
 * @typedef {import('./core.js').SceneOptions} SceneOptions
 * @typedef {import('./core.js').SceneSettings} SceneSettings
 * @typedef {import('./core.js').SceneHandle} SceneHandle
 * @typedef {import('./core.js').Renderer} Renderer
 */

/** The look every scene starts from, before its own. */
export const LOOK = Object.freeze({
	speed: 1,
	hue: 0,
	sat: 1,
	exposure: 1,
	tint: '#d4ff3a',
	tintAmount: 0,
	zoom: 1,
	angle: 0,
	grain: 1,
});

/** The look's number settings with labels and ranges, in the order a settings panel shows them. */
export const LOOK_PARAMS = Object.freeze(
	[
		{ key: 'speed', label: 'Speed', min: 0, max: 3, step: 0.05, default: 1 },
		{ key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, default: 0 },
		{ key: 'sat', label: 'Saturation', min: 0, max: 2, step: 0.02, default: 1 },
		{ key: 'exposure', label: 'Brightness', min: 0.3, max: 2, step: 0.02, default: 1 },
		{ key: 'tintAmount', label: 'Tint', min: 0, max: 1, step: 0.02, default: 0 },
		{ key: 'zoom', label: 'Zoom', min: 0.5, max: 2.5, step: 0.02, default: 1 },
		{ key: 'angle', label: 'Angle', min: -180, max: 180, step: 1, default: 0 },
		{ key: 'grain', label: 'Grain', min: 0, max: 3, step: 0.05, default: 1 },
	].map((p) => Object.freeze(p)),
);

/** Seconds into a scene that a still (reduced motion, `snapshot`) shows by default. */
export const STILL_TIME = 4;

/** How long a lazy scene keeps its context after leaving the screen, ms. */
const AWAY_MS = 4000;

/** The look's keys, the colour keys, and the keys that steer the runner. */
const LOOK_KEYS = /** @type {(keyof typeof LOOK)[]} */ (Object.keys(LOOK));
const COLOR_KEYS = ['colors', 'palette', 'glint'];
const RUN_KEYS = ['fps', 'scale', 'minScale', 'lazy', 'pointer'];
const KNOWN = new Set([...LOOK_KEYS, ...COLOR_KEYS, ...RUN_KEYS, 'params']);

/** The uniforms every scene's shader declares (src/head.js). */
const UNIFORMS = ['uRes', 'uTime', 'uMouse', 'uHue', 'uSat', 'uExposure', 'uTint', 'uTintAmt', 'uZoom', 'uAngle', 'uGrain', 'uC1', 'uC2', 'uC3', 'uC4', 'uP[0]'];

/** The full-screen triangle's vertex shader. */
const VERTEX = `#version 300 es
in vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

/** The context every scene asks for: opaque, no depth, no antialiasing, the low-power GPU. */
const CONTEXT = Object.freeze({ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false });

/* ---------- options ---------- */

/**
 * A hex colour as lower-case `#rrggbb`.
 *
 * @param {string} hex `#rgb` or `#rrggbb`.
 * @returns {string} `#rrggbb`.
 */
const longHex = (hex) => (hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex).toLowerCase();

/**
 * A hex colour as RGB, 0–1 each.
 *
 * @param {string} hex `#rgb` or `#rrggbb`.
 * @returns {[number, number, number]} Its channels.
 */
export function rgb(hex) {
	const h = longHex(hex);
	return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

/**
 * Checks that a value is a hex colour.
 *
 * @param {unknown} value The value.
 * @param {string} what What it is, for the message.
 * @throws {TypeError} When it isn't one.
 */
function checkHex(value, what) {
	if (typeof value !== 'string' || !HEX.test(value)) throw new TypeError(`${what} must be a hex colour (#rgb or #rrggbb), not ${JSON.stringify(value)}`);
}

/**
 * Checks a list of one to three hex colours.
 *
 * @param {unknown} list The list.
 * @param {string} what What it is, for the message.
 * @throws {TypeError} When it isn't one.
 */
function checkColors(list, what) {
	if (!Array.isArray(list) || list.length < 1 || list.length > 3) throw new TypeError(`${what} must be a list of one to three hex colours (the glint is \`glint\`)`);
	list.forEach((c, i) => checkHex(c, `${what}[${i}]`));
}

/**
 * Checks a scene definition well enough to run it (`define` checks it fully).
 *
 * @param {unknown} def The definition.
 * @throws {TypeError} When it isn't one.
 */
function checkDefinition(def) {
	const d = /** @type {SceneDefinition} */ (def);
	if (!d || typeof d !== 'object' || typeof d.fragment !== 'string' || !Array.isArray(d.params) || !d.look) throw new TypeError('Not a scene definition (import one from @arraypress/shaders/<name>, or make one with define())');
}

/**
 * Checks a scene's options: known keys, numbers that are numbers, colours
 * that are hex, params the scene has. Keys set to `undefined` are left out.
 *
 * @param {SceneDefinition} def The scene.
 * @param {SceneOptions} [options] Its options.
 * @throws {TypeError} When an option is unknown or the wrong type.
 * @throws {RangeError} When a number is out of its range.
 */
export function validateOptions(def, options = {}) {
	checkDefinition(def);
	if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Scene options must be an object');
	const o = /** @type {Record<string, any>} */ (options);
	for (const [key, value] of Object.entries(o)) {
		if (value === undefined) continue;
		if (!KNOWN.has(key)) throw new TypeError(`Unknown scene option "${key}"`);
		if (key === 'tint' || key === 'glint') checkHex(value, key);
		else if (key === 'colors') checkColors(value, 'colors');
		else if (key === 'palette') {
			if (typeof value === 'string') throw new TypeError('palette takes a palette ({ colors, glint }, e.g. PALETTES.Barbie from @arraypress/effects-astro), not its name');
			if (!value || typeof value !== 'object') throw new TypeError('palette must be { colors, glint }');
			checkColors(value.colors, 'palette.colors');
			if (value.glint !== undefined) checkHex(value.glint, 'palette.glint');
		} else if (key === 'params') {
			if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('params must be an object of numbers by key');
			const keys = def.params.map((p) => p.key);
			for (const [k, v] of Object.entries(value)) {
				if (v === undefined) continue;
				if (!keys.includes(k)) throw new TypeError(`Scene "${def.name}" has no param "${k}" (it has ${keys.join(', ') || 'none'})`);
				if (!Number.isFinite(v)) throw new TypeError(`params.${k} must be a finite number`);
			}
		} else if (key === 'lazy') {
			if (typeof value !== 'boolean' && !(typeof value === 'string' && value)) throw new TypeError('lazy must be true, false or a CSS length');
		} else if (key === 'pointer') {
			if (typeof value !== 'boolean' && !(value && typeof value.addEventListener === 'function')) throw new TypeError('pointer must be true, false or an element');
		} else {
			if (!Number.isFinite(value)) throw new TypeError(`${key} must be a finite number`);
			if ((key === 'scale' || key === 'minScale') && !(value > 0 && value <= 1)) throw new RangeError(`${key} must be more than 0 and at most 1`);
			if ((key === 'fps' || key === 'zoom') && !(value > 0)) throw new RangeError(`${key} must be more than 0`);
		}
	}
}

/**
 * A scene's settings: the default look, then the scene's own, then
 * `current` (a running scene's settings, when changing them), then the
 * options. Colours go palette first, then `colors` (any given replace the
 * palette's, in order), then `glint`.
 *
 * @param {SceneDefinition} def The scene.
 * @param {SceneOptions} [options] Its options.
 * @param {SceneSettings} [current] Settings to start from instead of the scene's.
 * @returns {SceneSettings} The settings, colours as lower-case `#rrggbb`.
 * @throws {TypeError|RangeError} When an option is invalid (see validateOptions).
 */
export function resolveSettings(def, options = {}, current) {
	validateOptions(def, options);
	const base = current ?? {
		...LOOK,
		...Object.fromEntries(LOOK_KEYS.filter((k) => def.look[k] !== undefined).map((k) => [k, def.look[k]])),
		colors: def.look.colors,
		glint: def.look.glint,
		params: Object.fromEntries(def.params.map((p) => [p.key, p.default])),
	};
	const out = { ...base, colors: [...base.colors], params: { ...base.params } };
	const o = /** @type {Record<string, any>} */ (options);
	for (const k of LOOK_KEYS) if (o[k] !== undefined) /** @type {Record<string, unknown>} */ (out)[k] = o[k];
	if (o.palette) {
		o.palette.colors.forEach((/** @type {string} */ c, /** @type {number} */ i) => (out.colors[i] = c));
		if (o.palette.glint) out.glint = o.palette.glint;
	}
	o.colors?.forEach((/** @type {string} */ c, /** @type {number} */ i) => (out.colors[i] = c));
	if (o.glint) out.glint = o.glint;
	for (const [k, v] of Object.entries(o.params ?? {})) if (v !== undefined) out.params[k] = v;
	out.colors = /** @type {[string, string, string]} */ (out.colors.map(longHex));
	out.glint = longHex(out.glint);
	out.tint = longHex(out.tint);
	return /** @type {SceneSettings} */ (out);
}

/**
 * The uniform values for a scene's settings, by uniform name: angles in
 * radians, colours as RGB 0–1, and `uP[0]` the scene's six settings in
 * its `params` order (unused ones 0).
 *
 * @param {SceneDefinition} def The scene.
 * @param {SceneSettings} settings Its settings (from resolveSettings).
 * @returns {Record<string, number | number[]>} The values.
 */
export function uniformValues(def, settings) {
	const p = [0, 0, 0, 0, 0, 0];
	def.params.forEach((d, i) => (p[i] = settings.params[d.key] ?? d.default));
	return {
		uHue: (settings.hue * Math.PI) / 180,
		uSat: settings.sat,
		uExposure: settings.exposure,
		uTint: rgb(settings.tint),
		uTintAmt: settings.tintAmount,
		uZoom: settings.zoom,
		uAngle: (settings.angle * Math.PI) / 180,
		uGrain: settings.grain,
		uC1: rgb(settings.colors[0]),
		uC2: rgb(settings.colors[1]),
		uC3: rgb(settings.colors[2]),
		uC4: rgb(settings.glint),
		'uP[0]': p,
	};
}

/**
 * A still CSS background that stands in for a scene before it draws and
 * where there is no WebGL 2: its three colours as soft blooms over its
 * ground.
 *
 * @param {SceneDefinition} def The scene.
 * @param {SceneOptions} [options] Its options (only the colours count).
 * @returns {string} A CSS `background`.
 */
export function fallback(def, options = {}) {
	const { colors } = resolveSettings(def, options);
	const at = ['22% 20%', '80% 74%', '30% 92%'];
	return [...colors.map((c, i) => `radial-gradient(at ${at[i]}, ${c}b3 0, transparent 60%)`), def.ground].join(', ');
}

/* ---------- GL ---------- */

/**
 * @typedef {object} Program
 * @property {WebGLProgram} program The linked program.
 * @property {WebGLBuffer} buffer The triangle.
 * @property {Record<string, WebGLUniformLocation | null>} u The uniforms by name.
 */

/**
 * Compiles a scene's fragment shader with the triangle's vertex shader,
 * binds the triangle, and finds the uniforms.
 *
 * @param {WebGL2RenderingContext} gl The context.
 * @param {string} fragment The fragment shader.
 * @returns {Program} The program, its triangle and its uniforms.
 * @throws {Error} When the shader doesn't compile or link (with the log).
 */
export function compile(gl, fragment) {
	/**
	 * Compiles one stage.
	 *
	 * @param {number} type The stage.
	 * @param {string} source Its source.
	 * @returns {WebGLShader} The shader.
	 * @throws {Error} When it doesn't compile.
	 */
	const stage = (type, source) => {
		const s = /** @type {WebGLShader} */ (gl.createShader(type));
		gl.shaderSource(s, source);
		gl.compileShader(s);
		if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(`Shader did not compile: ${gl.getShaderInfoLog(s)}`);
		return s;
	};
	const program = /** @type {WebGLProgram} */ (gl.createProgram());
	const vs = stage(gl.VERTEX_SHADER, VERTEX);
	const fs = stage(gl.FRAGMENT_SHADER, fragment);
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.bindAttribLocation(program, 0, 'p');
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(`Shader did not link: ${gl.getProgramInfoLog(program)}`);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	gl.useProgram(program);
	const buffer = /** @type {WebGLBuffer} */ (gl.createBuffer());
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	/** @type {Program['u']} */
	const u = {};
	for (const name of UNIFORMS) u[name] = gl.getUniformLocation(program, name);
	return { program, buffer, u };
}

/**
 * Hands a scene's settings to its program.
 *
 * @param {WebGL2RenderingContext} gl The context.
 * @param {Program} prog The program.
 * @param {SceneDefinition} def The scene.
 * @param {SceneSettings} settings Its settings.
 */
function push(gl, prog, def, settings) {
	gl.useProgram(prog.program);
	for (const [name, value] of Object.entries(uniformValues(def, settings))) {
		const at = prog.u[name];
		if (typeof value === 'number') gl.uniform1f(at, value);
		else if (name === 'uP[0]') gl.uniform1fv(at, new Float32Array(value));
		else gl.uniform3fv(at, value);
	}
}

/**
 * Draws a frame.
 *
 * @param {WebGL2RenderingContext} gl The context.
 * @param {Program} prog The program.
 * @param {number} width The buffer's width, px.
 * @param {number} height Its height, px.
 * @param {number} time The scene's time (uTime), seconds.
 * @param {readonly number[]} mouse The pointer, 0–1 from the bottom left.
 */
function render(gl, prog, width, height, time, mouse) {
	gl.useProgram(prog.program);
	gl.viewport(0, 0, width, height);
	gl.uniform2f(prog.u.uRes, width, height);
	gl.uniform1f(prog.u.uTime, time);
	gl.uniform2f(prog.u.uMouse, mouse[0], mouse[1]);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/**
 * Gives a context back to the browser now, rather than when it is collected.
 *
 * @param {WebGL2RenderingContext | null | undefined} gl The context.
 */
const lose = (gl) => gl?.getExtension('WEBGL_lose_context')?.loseContext();

/* ---------- the device ---------- */

/**
 * Is this a low-powered device (four cores or fewer, 4 GB or less, or data saver on)?
 *
 * @returns {boolean} True when it should start at a lower resolution.
 */
export function weakDevice() {
	if (typeof navigator === 'undefined') return false;
	const n = /** @type {Navigator & { deviceMemory?: number, connection?: { saveData?: boolean } }} */ (navigator);
	return (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 4 || n.connection?.saveData === true;
}

/**
 * Has the visitor asked for less motion?
 *
 * @returns {boolean} True with prefers-reduced-motion: reduce.
 */
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Is the tab hidden?
 *
 * @returns {boolean} True when it is.
 */
const hidden = () => typeof document !== 'undefined' && document.hidden;

/* ---------- a running scene ---------- */

/**
 * Runs a scene on a canvas, or in an element (a canvas of its own is made
 * inside it, filling it: use this in React, Svelte or Vue, which own their
 * DOM, since a lazy scene swaps its canvas for a fresh one).
 *
 * @param {Element} target A `<canvas>`, or an element to draw in.
 * @param {SceneDefinition} def The scene.
 * @param {SceneOptions} [options] Its options.
 * @returns {SceneHandle} Controls for it.
 * @throws {TypeError|RangeError} When the target or an option is invalid.
 */
export function scene(target, def, options = {}) {
	checkDefinition(def);
	const t = /** @type {any} */ (target);
	const own = t?.tagName !== 'CANVAS';
	if (!t || (own ? typeof t.appendChild !== 'function' : typeof t.getContext !== 'function')) throw new TypeError('scene() needs a <canvas> or an element to draw in');
	let settings = resolveSettings(def, options);
	let canvas = /** @type {HTMLCanvasElement} */ (own ? target.appendChild(document.createElement('canvas')) : target);
	if (own) canvas.style.cssText = 'display:block;width:100%;height:100%';

	const weak = weakDevice();
	let fps = options.fps ?? 30;
	let minScale = options.minScale ?? 0.3;
	/** @param {number} s A scale asked for. @returns {number} It as drawn: at most 1, less on a weak device. */
	const startScale = (s) => Math.min(s, 1) * (weak ? 0.75 : 1);
	let scale = startScale(options.scale ?? def.scale);
	const lazy = options.lazy ?? true;
	const still = reducedMotion();
	const mouse = [0.5, 0.5];

	/** @type {{ gl: WebGL2RenderingContext, prog: Program } | null} */
	let g = null;
	let lost = false; // the browser took the context
	let broken = false; // no WebGL 2, or the shader failed: stop trying
	let near = typeof IntersectionObserver === 'undefined';
	let paused = false;
	let stopped = false;
	let raf = 0;
	let last = 0;
	let late = 0;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let away;
	let clock = still ? STILL_TIME * settings.speed : 0;

	/** Makes the context and program on the current canvas. @returns {boolean} Whether it can draw. */
	const init = () => {
		if (broken) return false;
		const gl = /** @type {WebGL2RenderingContext | null} */ (canvas.getContext('webgl2', CONTEXT));
		if (!gl) {
			broken = true;
			return false;
		}
		try {
			g = { gl, prog: compile(gl, def.fragment) };
		} catch (error) {
			broken = true;
			console.warn('[@arraypress/shaders]', def.name, /** @type {Error} */ (error).message);
			lose(gl);
			return false;
		}
		canvas.setAttribute('data-gl', ''); // (marks a canvas holding a context: handy to check none linger)
		const held = canvas;
		held.addEventListener(
			'webglcontextlost',
			() => {
				if (canvas !== held) return;
				g = null;
				lost = true;
				cancel();
			},
			{ once: true },
		);
		push(gl, g.prog, def, settings);
		return true;
	};

	/** Stops the frame loop. */
	const cancel = () => {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	};

	/** Gives the context back, and puts a fresh canvas in this one's place for next time. */
	const release = () => {
		clearTimeout(away);
		cancel();
		if (!g && !lost) return;
		lose(g?.gl);
		g = null;
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

	/**
	 * Draws a frame at a time: the buffer sized to the canvas's CSS size ×
	 * min(device ratio, 1) × scale.
	 *
	 * @param {number} time The scene's time, seconds.
	 */
	const draw = (time) => {
		if (!g) return;
		const k = Math.min(globalThis.devicePixelRatio || 1, 1) * scale;
		const w = Math.max(1, Math.round(canvas.clientWidth * k));
		const h = Math.max(1, Math.round(canvas.clientHeight * k));
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		}
		render(g.gl, g.prog, w, h, time, mouse);
	};

	/**
	 * One tick of the loop: draws when a frame is due, and lowers the
	 * resolution while frames come late.
	 *
	 * @param {number} now The frame's time, ms.
	 */
	const tick = (now) => {
		raf = 0;
		if (!near || paused || stopped || hidden() || !g) return;
		raf = requestAnimationFrame(tick);
		const step = 1000 / fps;
		if (last && now - last < step - 2) return; // not yet: hold the frame rate down (the first frame draws at once)
		// frames coming much later than asked for: the device is struggling, so draw fewer pixels
		late = last && now - last > step * 1.8 ? late + 1 : Math.max(0, late - 1);
		if (late > 12 && scale > minScale) {
			scale = Math.max(minScale, scale * 0.8);
			late = 0;
		}
		// the scene's own clock: it runs at the look's speed, and a change of speed doesn't make it jump
		if (last) clock += ((now - last) / 1000) * settings.speed;
		last = now;
		draw(clock);
	};

	/** Starts drawing, if it should: near, visible, not stopped. */
	const start = () => {
		if (stopped || !near || hidden()) return;
		if (!g) {
			if (lost) release(); // the browser took it: start again on a fresh canvas
			if (!init()) return;
		}
		if (still || paused) return draw(clock);
		last = 0;
		if (!raf) raf = requestAnimationFrame(tick);
	};

	/** @param {boolean} isNear Whether the canvas is near the screen now. */
	const onNear = (isNear) => {
		near = isNear;
		if (near) {
			clearTimeout(away);
			start();
		} else {
			cancel();
			if (lazy !== false) away = setTimeout(release, AWAY_MS); // gone a while: give the context back
		}
	};
	const io =
		typeof IntersectionObserver === 'undefined'
			? null
			: new IntersectionObserver((entries) => entries.forEach((e) => e.target === canvas && onNear(e.isIntersecting)), { rootMargin: `${typeof lazy === 'string' ? lazy : '200px'} 0px` });
	io?.observe(canvas);
	// a still (or paused) scene redraws when its size changes
	const resizer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => g && near && !raf && draw(clock));
	resizer?.observe(canvas);
	const onVisible = () => start();
	document.addEventListener('visibilitychange', onVisible);

	/**
	 * The pointer, 0–1 from the canvas's bottom left: anywhere over the
	 * canvas's area (whatever is on top of it), or over the element given.
	 *
	 * @param {PointerEvent} e The move.
	 */
	const onMove = (e) => {
		if (!near) return;
		const b = canvas.getBoundingClientRect();
		const x = (e.clientX - b.left) / b.width;
		const y = 1 - (e.clientY - b.top) / b.height;
		if (options.pointer === undefined || options.pointer === true) {
			if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return;
		}
		mouse[0] = x;
		mouse[1] = y;
	};
	const pointerTarget = options.pointer === false ? null : options.pointer && options.pointer !== true ? options.pointer : typeof window === 'undefined' ? null : window;
	pointerTarget?.addEventListener('pointermove', /** @type {EventListener} */ (onMove), { passive: true });

	if (lazy === false) init();
	if (!io) start();

	return {
		get canvas() {
			return canvas;
		},
		set(next = {}) {
			if (next.lazy !== undefined || next.pointer !== undefined) throw new TypeError('lazy and pointer are set when a scene starts');
			settings = resolveSettings(def, next, settings);
			if (next.fps !== undefined) fps = next.fps;
			if (next.minScale !== undefined) minScale = next.minScale;
			if (next.scale !== undefined) scale = startScale(next.scale);
			if (!g) return;
			push(g.gl, g.prog, def, settings);
			if (!raf) draw(clock); // show it, even when it isn't animating
		},
		settings: () => ({ ...settings, colors: /** @type {[string, string, string]} */ ([...settings.colors]), params: { ...settings.params } }),
		frame(t) {
			if (!Number.isFinite(t)) throw new TypeError('frame(t) takes a time in seconds');
			paused = true;
			cancel();
			clock = t * settings.speed;
			if (!g) {
				if (stopped) return null;
				if (lost) release();
				if (!init()) return null;
				if (!near && lazy !== false) {
					clearTimeout(away);
					away = setTimeout(release, AWAY_MS);
				}
			}
			draw(clock);
			return canvas;
		},
		play() {
			paused = false;
			start();
		},
		pause() {
			paused = true;
			cancel();
		},
		stop() {
			if (stopped) return;
			stopped = true;
			cancel();
			clearTimeout(away);
			io?.disconnect();
			resizer?.disconnect();
			document.removeEventListener('visibilitychange', onVisible);
			pointerTarget?.removeEventListener('pointermove', /** @type {EventListener} */ (onMove));
			if (g) {
				// A canvas still on the page may be handed to another scene (as React's strict mode does):
				// keep its context for that, freeing only this scene's program. Otherwise give it back now.
				if (own || !canvas.isConnected) lose(g.gl);
				else {
					g.gl.deleteProgram(g.prog.program);
					g.gl.deleteBuffer(g.prog.buffer);
				}
			}
			g = null;
			if (own) canvas.remove();
		},
	};
}

/* ---------- off screen ---------- */

/**
 * Checks an output size.
 *
 * @param {unknown} width Pixels.
 * @param {unknown} height Pixels.
 * @throws {RangeError} When either isn't a whole number from 1.
 */
function checkSize(width, height) {
	for (const [k, v] of Object.entries({ width, height })) if (!Number.isInteger(v) || /** @type {number} */ (v) < 1) throw new RangeError(`${k} must be a whole number of pixels from 1`);
}

/**
 * A renderer for stills and frame sequences at an exact size, off screen
 * (an OffscreenCanvas where there is one): one context and one compile for
 * as many frames as you draw. `dispose()` gives the context back.
 *
 * @param {SceneDefinition} def The scene.
 * @param {SceneOptions} [options] Its options (the runner's own, `fps`, `scale`, `lazy`…, are ignored).
 * @param {{ width: number, height: number }} size The output's size, px.
 * @returns {Renderer} The renderer.
 * @throws {Error} Without WebGL 2, or when the size is beyond the GPU's limit.
 */
export function renderer(def, options = {}, { width, height } = /** @type {any} */ ({})) {
	checkDefinition(def);
	checkSize(width, height);
	let settings = resolveSettings(def, options);
	const canvas =
		typeof OffscreenCanvas === 'function'
			? new OffscreenCanvas(width, height)
			: Object.assign(document.createElement('canvas'), { width, height });
	const gl = /** @type {WebGL2RenderingContext | null} */ (canvas.getContext('webgl2', { ...CONTEXT, preserveDrawingBuffer: true }));
	if (!gl) throw new Error('No WebGL 2 here: a scene needs it');
	const [maxW, maxH] = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
	if (width > maxW || height > maxH) {
		lose(gl);
		throw new RangeError(`${width}×${height} is beyond this GPU's ${maxW}×${maxH}`);
	}
	/** @type {Program} */
	let prog;
	try {
		prog = compile(gl, def.fragment);
	} catch (error) {
		lose(gl);
		throw error;
	}
	push(gl, prog, def, settings);
	let disposed = false;
	return {
		canvas,
		set(next = {}) {
			settings = resolveSettings(def, next, settings);
			push(gl, prog, def, settings);
		},
		draw(t = STILL_TIME, pointer = [0.5, 0.5]) {
			if (disposed) throw new Error('This renderer has been disposed');
			render(gl, prog, width, height, t * settings.speed, pointer);
			return canvas;
		},
		toBlob({ type = 'image/png', quality } = {}) {
			if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality });
			return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The canvas gave no image'))), type, quality));
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			lose(gl);
		},
	};
}

/**
 * Renders one still of a scene at an exact size, as an image: for covers,
 * mockups and anything that wants the scene as a picture.
 *
 * @param {SceneDefinition} def The scene.
 * @param {SceneOptions} [options] Its options.
 * @param {{ width?: number, height?: number, t?: number, type?: string, quality?: number }} [output] Size (default 1200×1200), seconds in (default 4), and the image type (default PNG).
 * @returns {Promise<Blob>} The image.
 * @throws {Error} Without WebGL 2, or when the size is beyond the GPU's limit.
 */
export async function snapshot(def, options = {}, { width = 1200, height = 1200, t = STILL_TIME, type = 'image/png', quality } = {}) {
	const r = renderer(def, options, { width, height });
	try {
		r.draw(t);
		return await r.toBlob({ type, quality });
	} finally {
		r.dispose();
	}
}
