/**
 * @module @arraypress/shaders/load
 *
 * Loads a scene by name, each in its own chunk: a page pays only for the
 * scenes it shows. Use it with `scene` from `@arraypress/shaders/core` when
 * the name is only known at run time (a CMS field, a prop), instead of the
 * index, which takes in every scene.
 */

/** Each scene's module, loaded on first use. */
const LOADERS = {
	marble: () => import('./scenes/marble.js'),
	frosted: () => import('./scenes/frosted.js'),
	ribs: () => import('./scenes/ribs.js'),
	tiles: () => import('./scenes/tiles.js'),
	blob: () => import('./scenes/blob.js'),
	chrome: () => import('./scenes/chrome.js'),
	glitter: () => import('./scenes/glitter.js'),
	foil: () => import('./scenes/foil.js'),
	ribbon: () => import('./scenes/ribbon.js'),
	spiral: () => import('./scenes/spiral.js'),
	swirl: () => import('./scenes/swirl.js'),
	arches: () => import('./scenes/arches.js'),
	spheres: () => import('./scenes/spheres.js'),
	spheres2: () => import('./scenes/spheres2.js'),
	strands: () => import('./scenes/strands.js'),
	rings: () => import('./scenes/rings.js'),
	'ink-water': () => import('./scenes/ink-water.js'),
	topo: () => import('./scenes/topo.js'),
};

/** Every scene's name, in the order the index lists them. */
export const NAMES = Object.freeze(Object.keys(LOADERS));

/**
 * A scene's definition, by name.
 *
 * @param {string} name The scene (`marble`, `ink-water`…).
 * @returns {Promise<import('./core.js').SceneDefinition>} Its definition.
 * @throws {TypeError} When there is no scene by that name.
 */
export async function load(name) {
	const loader = Object.hasOwn(LOADERS, name) ? LOADERS[/** @type {keyof typeof LOADERS} */ (name)] : undefined;
	if (!loader) throw new TypeError(`No scene "${name}" (there are ${NAMES.join(', ')})`);
	return (await loader()).default;
}
