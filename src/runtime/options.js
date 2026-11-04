/**
 * @module @arraypress/shaders/runtime/options
 *
 * A scene's options, checked and resolved into its settings. Bad options
 * throw at once: an unknown key, a colour that isn't hex, a param the
 * scene doesn't have or a number that isn't finite is a TypeError; an
 * out-of-range `fps`, `zoom`, `scale` or `minScale` is a RangeError. An
 * option set to `undefined` counts as not given.
 */

import { LOOK, LOOK_KEYS } from './look.js';
import { checkHex, checkColors, longHex, paletteColors } from './color.js';

/**
 * @typedef {import('../types.js').SceneDefinition} SceneDefinition
 * @typedef {import('../types.js').SceneOptions} SceneOptions
 * @typedef {import('../types.js').SceneSettings} SceneSettings
 */

/** Every option a scene takes: the look, the colours, the runner's own, and `params`. */
const KNOWN = new Set([...LOOK_KEYS, 'colors', 'palette', 'glint', 'fps', 'scale', 'minScale', 'lazy', 'pointer', 'params']);

/**
 * Checks a scene definition well enough to run it (`define` checks it fully).
 *
 * @param {unknown} def The definition.
 * @throws {TypeError} When it isn't one.
 */
export function checkDefinition(def) {
	const d = /** @type {SceneDefinition} */ (def);
	if (!d || typeof d !== 'object' || typeof d.fragment !== 'string' || !Array.isArray(d.params) || !d.look) throw new TypeError('Not a scene definition (import one from @arraypress/shaders/<name>, or make one with define())');
}

/**
 * Checks a palette option.
 *
 * @param {unknown} value The palette.
 * @throws {TypeError} When it isn't `{ colors, glint }`.
 */
function checkPalette(value) {
	if (typeof value === 'string') throw new TypeError('palette takes a palette ({ colors, glint }, e.g. PALETTES.Barbie from @arraypress/effects-astro), not its name');
	if (!value || typeof value !== 'object') throw new TypeError('palette must be { colors, glint }');
	const p = /** @type {{ colors?: unknown, glint?: unknown }} */ (value);
	checkColors(p.colors, 'palette.colors');
	if (p.glint !== undefined) checkHex(p.glint, 'palette.glint');
}

/**
 * Checks a `params` option against the scene's settings.
 *
 * @param {SceneDefinition} def The scene.
 * @param {unknown} value The params.
 * @throws {TypeError} When it isn't an object of finite numbers by the scene's keys.
 */
function checkParams(def, value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('params must be an object of numbers by key');
	const keys = def.params.map((p) => p.key);
	for (const [k, v] of Object.entries(value)) {
		if (v === undefined) continue;
		if (!keys.includes(k)) throw new TypeError(`Scene "${def.name}" has no param "${k}" (it has ${keys.join(', ') || 'none'})`);
		if (!Number.isFinite(v)) throw new TypeError(`params.${k} must be a finite number`);
	}
}

/**
 * Checks a number option, and its range where it has one.
 *
 * @param {string} key The option.
 * @param {unknown} value Its value.
 * @throws {TypeError} When it isn't a finite number.
 * @throws {RangeError} When it is out of its range.
 */
function checkNumber(key, value) {
	if (!Number.isFinite(value)) throw new TypeError(`${key} must be a finite number`);
	const n = /** @type {number} */ (value);
	if ((key === 'scale' || key === 'minScale') && !(n > 0 && n <= 1)) throw new RangeError(`${key} must be more than 0 and at most 1`);
	if ((key === 'fps' || key === 'zoom') && !(n > 0)) throw new RangeError(`${key} must be more than 0`);
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
	for (const [key, value] of Object.entries(options)) {
		if (value === undefined) continue;
		if (!KNOWN.has(key)) throw new TypeError(`Unknown scene option "${key}"`);
		if (key === 'tint' || key === 'glint') checkHex(value, key);
		else if (key === 'colors') checkColors(value, 'colors');
		else if (key === 'palette') checkPalette(value);
		else if (key === 'params') checkParams(def, value);
		else if (key === 'lazy') {
			if (typeof value !== 'boolean' && !(typeof value === 'string' && value)) throw new TypeError('lazy must be true, false or a CSS length');
		} else if (key === 'pointer') {
			if (typeof value !== 'boolean' && !(value && typeof value.addEventListener === 'function')) throw new TypeError('pointer must be true, false or an element');
		} else checkNumber(key, value);
	}
}

/**
 * A scene's settings as it starts: the default look, then the scene's own
 * look, colours and param defaults.
 *
 * @param {SceneDefinition} def The scene.
 * @returns {SceneSettings} Its settings.
 */
function sceneDefaults(def) {
	return {
		...LOOK,
		...Object.fromEntries(LOOK_KEYS.filter((k) => def.look[k] !== undefined).map((k) => [k, def.look[k]])),
		colors: /** @type {[string, string, string]} */ ([...def.look.colors]),
		glint: def.look.glint,
		params: Object.fromEntries(def.params.map((p) => [p.key, p.default])),
	};
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
	const base = current ?? sceneDefaults(def);
	const look = Object.fromEntries(LOOK_KEYS.map((k) => [k, options[k] ?? base[k]]));
	const params = { ...base.params };
	for (const [k, v] of Object.entries(options.params ?? {})) if (v !== undefined) params[k] = v;
	return /** @type {SceneSettings} */ ({ ...base, ...look, tint: longHex(/** @type {string} */ (look.tint)), ...paletteColors(base.colors, base.glint, options), params });
}
