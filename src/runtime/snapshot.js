/**
 * @module @logomarks/shaders/runtime/snapshot
 *
 * One still of a scene at an exact size, as an image: for covers, mockups
 * and anything that wants the scene as a picture. 1200×1200 PNG, 4 s in,
 * by default.
 */

import { STILL_TIME } from './look.js';
import { renderer } from './renderer.js';

/**
 * Renders one still of a scene at an exact size, as an image.
 *
 * @param {import('../types.js').SceneDefinition} def The scene.
 * @param {import('../types.js').SceneOptions} [options] Its options.
 * @param {import('../types.js').SnapshotOutput} [output] Size (default 1200×1200), seconds in (default 4), and the image type (default PNG).
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
