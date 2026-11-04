/**
 * @arraypress/shaders
 *
 * WebGL 2 scene shaders: eighteen full-frame backgrounds (liquid marble,
 * frosted glass, glossy tiles, chrome, glitter, foil, ink in water…), each
 * one fragment shader taking its colours from a palette (three colours and
 * a glint) and its shape from a few named settings. Framework-free, with no
 * dependencies.
 *
 * This entry takes in every scene, and its functions take a scene by name.
 * To ship only the scenes a page uses, import them one by one
 * (`@arraypress/shaders/marble`) and run them with `@arraypress/shaders/core`,
 * or load them by name with `@arraypress/shaders/load`.
 *
 * @module @arraypress/shaders
 */

import * as core from './core.js';
import { marble } from './scenes/marble.js';
import { frosted } from './scenes/frosted.js';
import { ribs } from './scenes/ribs.js';
import { tiles } from './scenes/tiles.js';
import { blob } from './scenes/blob.js';
import { chrome } from './scenes/chrome.js';
import { glitter } from './scenes/glitter.js';
import { foil } from './scenes/foil.js';
import { ribbon } from './scenes/ribbon.js';
import { spiral } from './scenes/spiral.js';
import { swirl } from './scenes/swirl.js';
import { arches } from './scenes/arches.js';
import { spheres } from './scenes/spheres.js';
import { spheres2 } from './scenes/spheres2.js';
import { strands } from './scenes/strands.js';
import { rings } from './scenes/rings.js';
import { inkWater } from './scenes/ink-water.js';
import { topo } from './scenes/topo.js';

export { marble, frosted, ribs, tiles, blob, chrome, glitter, foil, ribbon, spiral, swirl, arches, spheres, spheres2, strands, rings, inkWater, topo };
export { LOOK, LOOK_PARAMS, STILL_TIME, MAX_PARAMS, HEAD, define, rgb, weakDevice, compile } from './core.js';
export { load, NAMES } from './load.js';

/** @typedef {import('./core.js').SceneDefinition} SceneDefinition */

/** Every scene, in order. */
const ALL = [marble, frosted, ribs, tiles, blob, chrome, glitter, foil, ribbon, spiral, swirl, arches, spheres, spheres2, strands, rings, inkWater, topo];
const BY_NAME = new Map(ALL.map((d) => [d.name, d]));

/** Every scene's name, title and description, by name. */
export const SCENES = Object.freeze(Object.fromEntries(ALL.map((d) => [d.name, Object.freeze({ name: d.name, title: d.title, description: d.description })])));

/** Every scene's own settings (key, label, range, step, default), by name, in the order its shader reads them. */
export const PARAMS = Object.freeze(Object.fromEntries(ALL.map((d) => [d.name, d.params])));

/**
 * A scene's definition.
 *
 * @param {string | SceneDefinition} name The scene's name, or a definition (returned as it is).
 * @returns {SceneDefinition} The definition.
 * @throws {TypeError} When there is no scene by that name.
 */
export function definition(name) {
	if (typeof name !== 'string') return name;
	const def = BY_NAME.get(name);
	if (!def) throw new TypeError(`No scene "${name}" (there are ${[...BY_NAME.keys()].join(', ')})`);
	return def;
}

/**
 * Runs a scene on a canvas, or in an element. See `scene` in `@arraypress/shaders/core`.
 *
 * @param {Element} target A `<canvas>`, or an element to draw in.
 * @param {string | SceneDefinition} name The scene.
 * @param {import('./core.js').SceneOptions} [options] Its options.
 * @returns {import('./core.js').SceneHandle} Controls for it.
 */
export const scene = (target, name, options) => core.scene(target, definition(name), options);

/**
 * Renders one still of a scene as an image. See `snapshot` in `@arraypress/shaders/core`.
 *
 * @param {string | SceneDefinition} name The scene.
 * @param {import('./core.js').SceneOptions} [options] Its options.
 * @param {{ width?: number, height?: number, t?: number, type?: string, quality?: number }} [output] Size, time and image type.
 * @returns {Promise<Blob>} The image.
 */
export const snapshot = (name, options, output) => core.snapshot(definition(name), options, output);

/**
 * A renderer for stills and frame sequences at an exact size. See `renderer` in `@arraypress/shaders/core`.
 *
 * @param {string | SceneDefinition} name The scene.
 * @param {import('./core.js').SceneOptions} options Its options.
 * @param {{ width: number, height: number }} size The output's size, px.
 * @returns {import('./core.js').Renderer} The renderer.
 */
export const renderer = (name, options, size) => core.renderer(definition(name), options, size);

/**
 * A scene's settings from its options. See `resolveSettings` in `@arraypress/shaders/core`.
 *
 * @param {string | SceneDefinition} name The scene.
 * @param {import('./core.js').SceneOptions} [options] Its options.
 * @param {import('./core.js').SceneSettings} [current] Settings to start from.
 * @returns {import('./core.js').SceneSettings} The settings.
 */
export const resolveSettings = (name, options, current) => core.resolveSettings(definition(name), options, current);

/**
 * Checks a scene's options. See `validateOptions` in `@arraypress/shaders/core`.
 *
 * @param {string | SceneDefinition} name The scene.
 * @param {import('./core.js').SceneOptions} [options] Its options.
 */
export const validateOptions = (name, options) => core.validateOptions(definition(name), options);

/**
 * The uniform values for a scene's settings. See `uniformValues` in `@arraypress/shaders/core`.
 *
 * @param {string | SceneDefinition} name The scene.
 * @param {import('./core.js').SceneSettings} settings Its settings.
 * @returns {Record<string, number | number[]>} The values.
 */
export const uniformValues = (name, settings) => core.uniformValues(definition(name), settings);

/**
 * A still CSS background for a scene. See `fallback` in `@arraypress/shaders/core`.
 *
 * @param {string | SceneDefinition} name The scene.
 * @param {import('./core.js').SceneOptions} [options] Its options.
 * @returns {string} A CSS `background`.
 */
export const fallback = (name, options) => core.fallback(definition(name), options);
