/**
 * @module @arraypress/shaders/define
 *
 * Makes a scene definition: checks it and freezes it, so a scene module is
 * only data (its name, its look, its settings and its fragment shader) and
 * a mistake in one fails when it loads, not when it draws.
 *
 * A scene of your own runs like any built-in one:
 *
 *     import { define, HEAD, scene } from '@arraypress/shaders/core';
 *     const plain = define({
 *       name: 'plain', title: 'Plain', description: 'The first colour, breathing.',
 *       scale: 0.5, ground: '#000000',
 *       look: { colors: ['#ff5c2e', '#14477a', '#eb4d8c'], glint: '#ffffff' },
 *       params: [{ key: 'pulse', label: 'Pulse', min: 0, max: 1, step: 0.01, default: 0.3 }],
 *       fragment: `${HEAD}
 *     void main() { o = vec4(finish(uC1 * (1.0 - uP[0] * 0.5 * (1.0 + sin(uTime))), gl_FragCoord.xy), 1.0); }`,
 *     });
 *     scene(canvas, plain);
 *
 * `HEAD` declares the uniforms (`uRes`, `uTime`, `uMouse` 0–1 from the
 * bottom left, the look, the palette `uC1`–`uC3` and glint `uC4`, and
 * `uP[6]`, the params in order) and the shared helpers (see ./head.js).
 */

import { HEX } from './runtime/color.js';

/** Settings a scene may have: its shader reads them as `uP[0]` … `uP[5]`. */
export const MAX_PARAMS = 6;

export { HEX };

/**
 * Checks a scene definition and freezes it, its look and its settings.
 *
 * @param {import('./types.js').SceneDefinition} def The scene.
 * @returns {Readonly<import('./types.js').SceneDefinition>} It, frozen.
 * @throws {TypeError} When a field is missing or malformed.
 */
export function define(def) {
	const fail = (/** @type {string} */ why) => {
		throw new TypeError(`Scene "${def?.name}": ${why}`);
	};
	if (!def || typeof def !== 'object') throw new TypeError('A scene definition must be an object');
	if (typeof def.name !== 'string' || !/^[a-z][a-z0-9-]*$/.test(def.name)) fail('name must be lower-case kebab-case');
	if (typeof def.title !== 'string' || !def.title || typeof def.description !== 'string') fail('it needs a title and a description');
	if (typeof def.fragment !== 'string' || !def.fragment.startsWith('#version 300 es')) fail('fragment must be a GLSL ES 3.00 shader');
	if (!(def.scale > 0 && def.scale <= 1)) fail('scale must be in (0, 1]');
	if (!HEX.test(def.ground ?? '')) fail('ground must be a hex colour');
	const { colors, glint } = def.look ?? {};
	if (!Array.isArray(colors) || colors.length !== 3 || !colors.every((c) => HEX.test(c)) || !HEX.test(glint ?? '')) fail('look needs three hex colors and a glint');
	if (!Array.isArray(def.params) || def.params.length > MAX_PARAMS) fail(`params must be a list of at most ${MAX_PARAMS}`);
	const keys = new Set();
	for (const p of def.params) {
		if (keys.has(p.key)) fail(`two params are called "${p.key}"`);
		keys.add(p.key);
		if (![p.min, p.max, p.step, p.default].every(Number.isFinite) || p.min > p.max || p.default < p.min || p.default > p.max) fail(`param "${p.key}" needs min ≤ default ≤ max and a step`);
	}
	return Object.freeze({
		...def,
		look: Object.freeze({ ...def.look, colors: Object.freeze([...colors]) }),
		params: Object.freeze(def.params.map((p) => Object.freeze({ ...p }))),
	});
}
