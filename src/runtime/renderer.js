/**
 * @module @logomarks/shaders/runtime/renderer
 *
 * Renders a scene off screen at an exact size (on an OffscreenCanvas
 * where there is one), with one context and one compile for as many
 * frames as are drawn: for a frame sequence (video, a Spotify Canvas).
 * Times are seconds at the scene's speed, so `t` is the frame a running
 * scene shows `t` seconds in.
 */

import { STILL_TIME } from './look.js';
import { checkDefinition, resolveSettings } from './options.js';
import { pushUniforms } from './uniforms.js';
import { CONTEXT, compile, drawFrame, loseContext } from './gl.js';

/**
 * @typedef {import('../types.js').SceneDefinition} SceneDefinition
 * @typedef {import('../types.js').SceneOptions} SceneOptions
 * @typedef {import('../types.js').Renderer} Renderer
 * @typedef {import('./gl.js').Program} Program
 */

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
 * An off-screen canvas of a size: an OffscreenCanvas, or a detached canvas where there is none.
 *
 * @param {number} width Pixels.
 * @param {number} height Pixels.
 * @returns {OffscreenCanvas | HTMLCanvasElement} The canvas.
 */
const offscreen = (width, height) => (typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(width, height) : Object.assign(document.createElement('canvas'), { width, height }));

/**
 * A renderer for stills and frame sequences at an exact size, off screen:
 * one context and one compile for as many frames as you draw.
 * `dispose()` gives the context back.
 *
 * @param {SceneDefinition} def The scene.
 * @param {SceneOptions} [options] Its options (the runner's own, `fps`, `scale`, `lazy`…, are ignored).
 * @param {{ width: number, height: number }} size The output's size, px.
 * @returns {Renderer} The renderer.
 * @throws {Error} Without WebGL 2, or when the size is beyond the GPU's limit.
 */
export function renderer(def, options = {}, { width, height } = /** @type {{ width: number, height: number }} */ ({})) {
	checkDefinition(def);
	checkSize(width, height);
	let settings = resolveSettings(def, options);
	const canvas = offscreen(width, height);
	const gl = /** @type {WebGL2RenderingContext | null} */ (canvas.getContext('webgl2', { ...CONTEXT, preserveDrawingBuffer: true }));
	if (!gl) throw new Error('No WebGL 2 here: a scene needs it');
	const [maxW, maxH] = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
	if (width > maxW || height > maxH) {
		loseContext(gl);
		throw new RangeError(`${width}×${height} is beyond this GPU's ${maxW}×${maxH}`);
	}
	/** @type {Program} */
	let prog;
	try {
		prog = compile(gl, def.fragment);
	} catch (error) {
		loseContext(gl);
		throw error;
	}
	pushUniforms(gl, prog, def, settings);
	let disposed = false;
	return {
		canvas,
		set(next = {}) {
			settings = resolveSettings(def, next, settings);
			pushUniforms(gl, prog, def, settings);
		},
		draw(t = STILL_TIME, pointer = [0.5, 0.5]) {
			if (disposed) throw new Error('This renderer has been disposed');
			drawFrame(gl, prog, width, height, t * settings.speed, pointer);
			return canvas;
		},
		toBlob({ type = 'image/png', quality } = {}) {
			if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality });
			return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The canvas gave no image'))), type, quality));
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			loseContext(gl);
		},
	};
}
