/**
 * @module @arraypress/shaders/runtime/scene
 *
 * Runs a scene on a page, as cheaply as it can look right:
 *
 * - It holds a WebGL context only while near the screen, and gives it back
 *   four seconds after it leaves, on a fresh canvas (./lifecycle.js).
 * - It draws only while near the screen and the tab is visible.
 * - It draws at a share of the screen's resolution (the scene's `scale`,
 *   never above one device pixel per CSS pixel): soft pictures lose
 *   nothing when the browser scales them up. Weak devices (four cores or
 *   fewer, 4 GB or less, data saver) start at three quarters of that, and
 *   when frames come late it steps down, to `minScale` (./loop.js).
 * - It draws `fps` frames a second (30), not the screen's 60 or 120.
 * - With prefers-reduced-motion, it draws one frame (4 s in) and stops.
 *
 * `stop()` frees the context at once, unless the canvas is still on the
 * page and was passed in: then it keeps the context, so another scene can
 * reuse the canvas (React's strict mode mounts twice).
 *
 * In React, Svelte or Vue, pass an element (they own their DOM, and a lazy
 * scene swaps its canvas), start it on mount and stop it on unmount:
 *
 *     useEffect(() => { const h = scene(ref.current, 'marble', { palette }); return () => h.stop(); }, []);
 *
 * `frame(t)` draws on the page's canvas at its on-screen size: read that
 * canvas in the same task, before the browser clears it.
 */

import { STILL_TIME } from './look.js';
import { checkDefinition, resolveSettings } from './options.js';
import { pushUniforms } from './uniforms.js';
import { drawFrame } from './gl.js';
import { weakDevice, reducedMotion, hidden } from './device.js';
import { frameLoop } from './loop.js';
import { followPointer } from './pointer.js';
import { lazyContext } from './lifecycle.js';

/**
 * @typedef {import('../types.js').SceneDefinition} SceneDefinition
 * @typedef {import('../types.js').SceneOptions} SceneOptions
 * @typedef {import('../types.js').SceneHandle} SceneHandle
 */

/**
 * The canvas to draw on: the target, or a canvas made inside it, filling it.
 *
 * @param {Element} target A `<canvas>`, or an element to draw in.
 * @returns {{ canvas: HTMLCanvasElement, own: boolean }} The canvas, and whether it was made here.
 * @throws {TypeError} When the target is neither.
 */
function canvasFor(target) {
	const t = /** @type {Element & Partial<HTMLCanvasElement>} */ (target);
	const own = t?.tagName !== 'CANVAS';
	if (!t || (own ? typeof t.appendChild !== 'function' : typeof t.getContext !== 'function')) throw new TypeError('scene() needs a <canvas> or an element to draw in');
	if (!own) return { canvas: /** @type {HTMLCanvasElement} */ (target), own };
	const canvas = target.appendChild(document.createElement('canvas'));
	canvas.style.cssText = 'display:block;width:100%;height:100%';
	return { canvas, own };
}

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
	const { canvas: first, own } = canvasFor(target);
	let settings = resolveSettings(def, options);
	const weak = weakDevice();
	/** @param {number} s A scale asked for. @returns {number} It as drawn: at most 1, less on a weak device. */
	const startScale = (s) => Math.min(s, 1) * (weak ? 0.75 : 1);
	const lazy = options.lazy ?? true;
	const still = reducedMotion();
	let near = typeof IntersectionObserver === 'undefined';
	let paused = false;
	let stopped = false;
	let clock = still ? STILL_TIME * settings.speed : 0;

	/**
	 * Draws a frame at a time: the buffer sized to the canvas's CSS size ×
	 * min(device ratio, 1) × scale.
	 *
	 * @param {number} time The scene's time, seconds.
	 */
	const draw = (time) => {
		const held = ctx.held;
		if (!held) return;
		const canvas = ctx.canvas;
		const k = Math.min(globalThis.devicePixelRatio || 1, 1) * loop.scale;
		const w = Math.max(1, Math.round(canvas.clientWidth * k));
		const h = Math.max(1, Math.round(canvas.clientHeight * k));
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		}
		drawFrame(held.gl, held.prog, w, h, time, pointer.mouse);
	};

	// the scene's own clock runs at the look's speed, so a change of speed doesn't make it jump
	const loop = frameLoop(
		{ fps: options.fps ?? 30, scale: startScale(options.scale ?? def.scale), minScale: options.minScale ?? 0.3 },
		() => near && !paused && !stopped && !hidden() && ctx.held !== null,
		(seconds) => draw((clock += seconds * settings.speed)),
	);

	/** Starts drawing, if it should: near, visible, not stopped. */
	const start = () => {
		if (stopped || !near || hidden()) return;
		if (!ctx.ensure()) return;
		if (still || paused) return draw(clock);
		loop.start();
	};

	const pointer = followPointer(options.pointer, () => ctx.canvas, () => near);
	const ctx = lazyContext(first, def, {
		margin: typeof lazy === 'string' ? lazy : '200px',
		onNear(isNear) {
			near = isNear;
			if (near) {
				ctx.stay();
				start();
			} else {
				loop.cancel();
				if (lazy !== false) ctx.leaveSoon(); // gone a while: give the context back
			}
		},
		onResize: () => ctx.held && near && !loop.running && draw(clock),
		onReady: (gl, prog) => pushUniforms(gl, prog, def, settings),
		onLost: () => loop.cancel(),
		onRelease: () => loop.cancel(),
	});
	const onVisible = () => start();
	document.addEventListener('visibilitychange', onVisible);

	if (lazy === false) ctx.acquire();
	if (!ctx.observing) start();

	return {
		get canvas() {
			return ctx.canvas;
		},
		set(next = {}) {
			if (next.lazy !== undefined || next.pointer !== undefined) throw new TypeError('lazy and pointer are set when a scene starts');
			settings = resolveSettings(def, next, settings);
			if (next.fps !== undefined) loop.fps = next.fps;
			if (next.minScale !== undefined) loop.minScale = next.minScale;
			if (next.scale !== undefined) loop.scale = startScale(next.scale);
			const held = ctx.held;
			if (!held) return;
			pushUniforms(held.gl, held.prog, def, settings);
			if (!loop.running) draw(clock); // show it, even when it isn't animating
		},
		settings: () => ({ ...settings, colors: /** @type {[string, string, string]} */ ([...settings.colors]), params: { ...settings.params } }),
		frame(t) {
			if (!Number.isFinite(t)) throw new TypeError('frame(t) takes a time in seconds');
			paused = true;
			loop.cancel();
			clock = t * settings.speed;
			if (!ctx.held) {
				if (stopped || !ctx.ensure()) return null;
				if (!near && lazy !== false) ctx.leaveSoon();
			}
			draw(clock);
			return ctx.canvas;
		},
		play() {
			paused = false;
			start();
		},
		pause() {
			paused = true;
			loop.cancel();
		},
		stop() {
			if (stopped) return;
			stopped = true;
			loop.cancel();
			document.removeEventListener('visibilitychange', onVisible);
			pointer.stop();
			ctx.dispose(own);
		},
	};
}
