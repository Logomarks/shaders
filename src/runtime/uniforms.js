/**
 * @module @arraypress/shaders/runtime/uniforms
 *
 * A scene's settings as the uniforms its shader reads (`src/glsl/uniforms.js`
 * declares them), and handing them to a program.
 */

import { rgb } from './color.js';

/**
 * @typedef {import('../types.js').SceneDefinition} SceneDefinition
 * @typedef {import('../types.js').SceneSettings} SceneSettings
 * @typedef {import('./gl.js').Program} Program
 */

/** The uniforms every scene's shader declares. */
export const UNIFORMS = Object.freeze(['uRes', 'uTime', 'uMouse', 'uHue', 'uSat', 'uExposure', 'uTint', 'uTintAmt', 'uZoom', 'uAngle', 'uGrain', 'uC1', 'uC2', 'uC3', 'uC4', 'uP[0]']);

/** Degrees to radians. @param {number} deg Degrees. @returns {number} Radians. */
const radians = (deg) => (deg * Math.PI) / 180;

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
		uHue: radians(settings.hue),
		uSat: settings.sat,
		uExposure: settings.exposure,
		uTint: rgb(settings.tint),
		uTintAmt: settings.tintAmount,
		uZoom: settings.zoom,
		uAngle: radians(settings.angle),
		uGrain: settings.grain,
		uC1: rgb(settings.colors[0]),
		uC2: rgb(settings.colors[1]),
		uC3: rgb(settings.colors[2]),
		uC4: rgb(settings.glint),
		'uP[0]': p,
	};
}

/**
 * Hands a scene's settings to its program.
 *
 * @param {WebGL2RenderingContext} gl The context.
 * @param {Program} prog The program.
 * @param {SceneDefinition} def The scene.
 * @param {SceneSettings} settings Its settings.
 */
export function pushUniforms(gl, prog, def, settings) {
	gl.useProgram(prog.program);
	for (const [name, value] of Object.entries(uniformValues(def, settings))) {
		const at = prog.u[name];
		if (typeof value === 'number') gl.uniform1f(at, value);
		else if (name === 'uP[0]') gl.uniform1fv(at, new Float32Array(value));
		else gl.uniform3fv(at, value);
	}
}
