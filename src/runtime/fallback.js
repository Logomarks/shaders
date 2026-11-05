/**
 * @module @logomarks/shaders/runtime/fallback
 *
 * A still CSS background for a scene: its three colours as soft blooms
 * over its ground. Put it behind the canvas, so something shows before
 * the scene draws, and wherever there is no WebGL 2.
 */

import { resolveSettings } from './options.js';

/** Where each colour blooms. */
const AT = ['22% 20%', '80% 74%', '30% 92%'];

/**
 * A still CSS background that stands in for a scene.
 *
 * @param {import('../types.js').SceneDefinition} def The scene.
 * @param {import('../types.js').SceneOptions} [options] Its options (only the colours count).
 * @returns {string} A CSS `background`.
 */
export function fallback(def, options = {}) {
	const { colors } = resolveSettings(def, options);
	return [...colors.map((c, i) => `radial-gradient(at ${AT[i]}, ${c}b3 0, transparent 60%)`), def.ground].join(', ');
}
