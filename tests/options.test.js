/**
 * @logomarks/shaders — options: how palettes, colours, the look and a
 * scene's params resolve into settings and uniforms, what is refused, and
 * the still fallback.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSettings, validateOptions, uniformValues, fallback, define, LOOK, LOOK_PARAMS, HEAD, marble, tiles, frosted, topo } from '../src/index.js';

/** Two of @arraypress/effects-astro's PALETTES, as it has them (copied, not imported: effects-astro depends on this package). */
const BARBIE = { colors: ['#ff0bce', '#1bfefe', '#2d026e'], glint: '#ff00ff' };
const SAFFRON = { colors: ['#ffb700', '#521212', '#ffcb53'], glint: '#ff8c00' };

describe('resolveSettings', () => {
	it('starts from the default look, the scene’s colours and its params’ defaults', () => {
		const s = resolveSettings('marble');
		for (const [k, v] of Object.entries(LOOK)) assert.equal(/** @type {any} */ (s)[k], v, k);
		assert.deepEqual(s.colors, ['#ff5c2e', '#14477a', '#eb4d8c']);
		assert.equal(s.glint, '#bfdbf2');
		assert.deepEqual(s.params, { scale: 1.1, sharpness: 0.8, warp: 1.8, relief: 0.6 });
	});

	it('takes a scene’s own look over the default', () => {
		assert.equal(resolveSettings(tiles).grain, 0.35);
		assert.equal(resolveSettings(frosted).angle, 128);
		assert.equal(resolveSettings(frosted).grain, 0.2);
		assert.equal(resolveSettings(frosted, { grain: 2 }).grain, 2);
	});

	it('takes an effects-astro palette: its three colours and its glint', () => {
		const s = resolveSettings('marble', { palette: BARBIE });
		assert.deepEqual(s.colors, BARBIE.colors);
		assert.equal(s.glint, BARBIE.glint);
	});

	it('puts colors over the palette, one by one, and glint over both', () => {
		const s = resolveSettings('marble', { palette: SAFFRON, colors: ['#000'], glint: '#ABCDEF' });
		assert.deepEqual(s.colors, ['#000000', '#521212', '#ffcb53']);
		assert.equal(s.glint, '#abcdef');
	});

	it('keeps the scene’s glint for a palette without one, and normalises #rgb', () => {
		const s = resolveSettings('topo', { palette: { colors: ['#F0B', '#0f0', '#00F'] } });
		assert.deepEqual(s.colors, ['#ff00bb', '#00ff00', '#0000ff']);
		assert.equal(s.glint, topo.look.glint);
	});

	it('changes only the params given, by key', () => {
		const s = resolveSettings('marble', { params: { scale: 1.2, warp: undefined } });
		assert.deepEqual(s.params, { scale: 1.2, sharpness: 0.8, warp: 1.8, relief: 0.6 });
	});

	it('builds on current settings, as set() does, and round-trips its own output', () => {
		const first = resolveSettings('marble', { palette: BARBIE, speed: 2, params: { warp: 3 } });
		const next = resolveSettings('marble', { hue: 40, params: { relief: 1 } }, first);
		assert.equal(next.speed, 2);
		assert.equal(next.hue, 40);
		assert.deepEqual(next.colors, BARBIE.colors);
		assert.deepEqual(next.params, { scale: 1.1, sharpness: 0.8, warp: 3, relief: 1 });
		assert.deepEqual(first.params.relief, 0.6, 'current is not changed');
		assert.deepEqual(resolveSettings('marble', next), next, 'settings are options');
	});

	it('ignores options set to undefined (as props left out arrive)', () => {
		assert.deepEqual(resolveSettings('marble', { palette: undefined, colors: undefined, speed: undefined, fps: undefined }), resolveSettings('marble'));
	});
});

describe('validateOptions', () => {
	/** @type {[string, object, RegExp, (typeof TypeError | typeof RangeError)?][]} */
	const bad = [
		['an unknown option', { pallete: BARBIE }, /Unknown scene option "pallete"/],
		['a palette by name', { palette: 'Barbie' }, /palette takes a palette \(\{ colors, glint \}/],
		['a palette without colours', { palette: { glint: '#fff' } }, /palette.colors must be a list/],
		['four colours', { colors: ['#000', '#111', '#222', '#333'] }, /one to three hex colours \(the glint is `glint`\)/],
		['a colour that isn’t hex', { colors: ['red'] }, /colors\[0\] must be a hex colour/],
		['a bad glint', { glint: 'rgb(0,0,0)' }, /glint must be a hex colour/],
		['a bad tint', { tint: '#12345' }, /tint must be a hex colour/],
		['a param the scene hasn’t', { params: { size: 2 } }, /Scene "marble" has no param "size" \(it has scale, sharpness, warp, relief\)/],
		['a param that isn’t a number', { params: { scale: '2' } }, /params.scale must be a finite number/],
		['params as a list', { params: [1, 2] }, /params must be an object/],
		['a look value that isn’t finite', { speed: NaN }, /speed must be a finite number/],
		['a look value as a string', { hue: '20' }, /hue must be a finite number/],
		['fps of 0', { fps: 0 }, /fps must be more than 0/, RangeError],
		['zoom of 0', { zoom: 0 }, /zoom must be more than 0/, RangeError],
		['scale over 1', { scale: 1.5 }, /scale must be more than 0 and at most 1/, RangeError],
		['minScale of 0', { minScale: 0 }, /minScale must be more than 0/, RangeError],
		['lazy as an empty string', { lazy: '' }, /lazy must be true, false or a CSS length/],
		['pointer as a selector', { pointer: '#hero' }, /pointer must be true, false or an element/],
	];
	for (const [what, options, message, type = TypeError] of bad) {
		it(`refuses ${what}`, () => {
			assert.throws(() => validateOptions('marble', /** @type {any} */ (options)), (e) => e instanceof type && message.test(/** @type {Error} */ (e).message));
		});
	}

	it('accepts every option a scene takes', () => {
		assert.doesNotThrow(() =>
			validateOptions('marble', {
				...{ speed: 0, hue: -30, sat: 1.4, exposure: 0.8, tint: '#fff', tintAmount: 0.2, zoom: 1.5, angle: 45, grain: 0 },
				...{ colors: ['#000'], palette: BARBIE, glint: '#fff', params: { scale: 2 } },
				...{ fps: 24, scale: 0.6, minScale: 0.2, lazy: '400px', pointer: false },
			}),
		);
		assert.doesNotThrow(() => validateOptions('marble', { lazy: false, pointer: true }));
	});

	it('refuses options that aren’t an object, and a scene that isn’t one', () => {
		assert.throws(() => validateOptions('marble', /** @type {any} */ ('fast')), TypeError);
		assert.throws(() => validateOptions(/** @type {any} */ ({ name: 'x' }), {}), /Not a scene definition/);
	});
});

describe('uniformValues', () => {
	it('turns settings into the uniforms the head declares', () => {
		const u = uniformValues('marble', resolveSettings('marble', { hue: 180, angle: 90, tintAmount: 0.5, colors: ['#ff0000', '#00ff00', '#0000ff'], glint: '#ffffff', params: { warp: 3 } }));
		assert.equal(u.uHue, Math.PI);
		assert.equal(u.uAngle, Math.PI / 2);
		assert.equal(u.uTintAmt, 0.5);
		assert.deepEqual(u.uC1, [1, 0, 0]);
		assert.deepEqual(u.uC2, [0, 1, 0]);
		assert.deepEqual(u.uC3, [0, 0, 1]);
		assert.deepEqual(u.uC4, [1, 1, 1]);
		assert.deepEqual(u['uP[0]'], [1.1, 0.8, 3, 0.6, 0, 0], 'in params order, the rest 0');
		for (const name of Object.keys(u)) assert.match(HEAD, new RegExp(`\\b${name.replace('[0]', '')}\\b`), `${name} is declared`);
	});
});

describe('fallback', () => {
	it('blooms the colours over the scene’s ground', () => {
		const css = fallback('blob', { palette: BARBIE });
		for (const c of BARBIE.colors) assert.ok(css.includes(`${c}b3`), c);
		assert.ok(css.endsWith(', #ece7e6'));
		assert.match(fallback(marble), /, #060608$/);
	});
});

describe('LOOK_PARAMS', () => {
	it('lists every number in the look, with its default in range', () => {
		assert.deepEqual(
			LOOK_PARAMS.map((p) => p.key).sort(),
			Object.keys(LOOK)
				.filter((k) => k !== 'tint')
				.sort(),
		);
		for (const p of LOOK_PARAMS) assert.equal(p.default, /** @type {any} */ (LOOK)[p.key], p.key);
	});
});

describe('define', () => {
	const good = { name: 'plain', title: 'Plain', description: 'A plain colour.', scale: 0.5, ground: '#000000', look: { colors: ['#111111', '#222222', '#333333'], glint: '#ffffff' }, params: [{ key: 'level', label: 'Level', min: 0, max: 1, step: 0.1, default: 0.5 }], fragment: `${HEAD}void main() { o = vec4(finish(uC1 * uP[0], gl_FragCoord.xy), 1.0); }` };

	it('freezes a good definition, and it runs through the options like any scene', () => {
		const def = define(good);
		assert.ok(Object.isFrozen(def) && Object.isFrozen(def.params[0]));
		assert.equal(resolveSettings(def, { params: { level: 0.9 } }).params.level, 0.9);
	});

	/** @type {[string, object][]} */
	const broken = [
		['a name in camelCase', { name: 'inkWater' }],
		['no title', { title: '' }],
		['a WebGL 1 shader', { fragment: 'void main() {}' }],
		['a scale over 1', { scale: 2 }],
		['two colours', { look: { colors: ['#000', '#fff'], glint: '#fff' } }],
		['no glint', { look: { colors: ['#000', '#111', '#222'] } }],
		['seven params', { params: Array.from({ length: 7 }, (_, i) => ({ key: `p${i}`, label: 'P', min: 0, max: 1, step: 0.1, default: 0 })) }],
		['a default out of range', { params: [{ key: 'a', label: 'A', min: 0, max: 1, step: 0.1, default: 2 }] }],
		['two params with one key', { params: [good.params[0], good.params[0]] }],
		['a ground that isn’t hex', { ground: 'black' }],
	];
	for (const [what, change] of broken) {
		it(`refuses ${what}`, () => assert.throws(() => define(/** @type {any} */ ({ ...good, ...change })), TypeError));
	}
});
