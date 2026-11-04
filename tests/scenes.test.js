/**
 * @arraypress/shaders — the scene registry: every scene is listed, defined
 * well, importable on its own and by name, and declared in the types and
 * the package's exports.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as shaders from '../src/index.js';
import { load, NAMES } from '../src/load.js';
import { MAX_PARAMS, HEX } from '../src/define.js';

const ORDER = ['marble', 'frosted', 'ribs', 'tiles', 'blob', 'chrome', 'glitter', 'foil', 'ribbon', 'spiral', 'swirl', 'arches', 'spheres', 'spheres2', 'strands', 'rings', 'ink-water', 'topo'];
const camel = (/** @type {string} */ s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

describe('the registry', () => {
	it('lists eighteen scenes, in order, each with a title and a description', () => {
		assert.deepEqual(Object.keys(shaders.SCENES), ORDER);
		for (const [name, s] of Object.entries(shaders.SCENES)) {
			assert.equal(s.name, name);
			assert.ok(s.title.length > 2, name);
			assert.match(s.description, /^[A-Z].*\.$/, name);
		}
		assert.ok(Object.isFrozen(shaders.SCENES));
	});

	it('PARAMS has each scene’s settings, the same objects as its definition', () => {
		assert.deepEqual(Object.keys(shaders.PARAMS), ORDER);
		for (const name of ORDER) assert.equal(shaders.PARAMS[/** @type {keyof typeof shaders.PARAMS} */ (name)], shaders.definition(name).params);
	});

	it('load() lists the same names and loads the same definitions', async () => {
		assert.deepEqual(NAMES, ORDER);
		for (const name of ORDER) assert.equal(await load(/** @type {any} */ (name)), shaders.definition(name));
		await assert.rejects(load(/** @type {any} */ ('crt')), TypeError);
		await assert.rejects(load(/** @type {any} */ ('toString')), TypeError);
	});

	it('definition() finds a scene by name, passes a definition through, and names the scenes for an unknown one', () => {
		assert.equal(shaders.definition('marble'), shaders.marble);
		assert.equal(shaders.definition(shaders.topo), shaders.topo);
		assert.throws(() => shaders.definition('inkWater'), /No scene "inkWater" \(there are marble, .*ink-water/);
	});
});

describe('each scene', () => {
	for (const name of ORDER) {
		it(`${name}: is well defined, frozen, and importable on its own`, async () => {
			const mod = await import(`../src/scenes/${name}.js`);
			const def = mod.default;
			assert.equal(mod[camel(name)], def);
			assert.equal(/** @type {any} */ (shaders)[camel(name)], def);
			assert.equal(def.name, name);
			assert.ok(Object.isFrozen(def) && Object.isFrozen(def.look) && Object.isFrozen(def.params) && def.params.every(Object.isFrozen));
			assert.ok(def.scale > 0 && def.scale <= 1);
			assert.match(def.ground, HEX);
			assert.equal(def.look.colors.length, 3);
			[...def.look.colors, def.look.glint].forEach((c) => assert.match(c, HEX));
			assert.ok(def.params.length >= 4 && def.params.length <= MAX_PARAMS);
			for (const p of def.params) {
				assert.match(p.key, /^[a-z][a-zA-Z]*$/);
				assert.ok(p.min <= p.default && p.default <= p.max && p.step > 0, p.key);
			}
			assert.ok(def.fragment.startsWith('#version 300 es\nprecision highp float;'));
			assert.ok(def.fragment.startsWith(shaders.HEAD));
		});

		it(`${name}: its shader reads exactly the settings it lists`, () => {
			const def = shaders.definition(name);
			const body = def.fragment.slice(shaders.HEAD.length);
			const read = new Set([...body.matchAll(/uP\[(\d)\]/g)].map((m) => Number(m[1])));
			assert.deepEqual([...read].sort(), def.params.map((_, i) => i), 'each uP index it reads has a param, and each param is read');
		});

		it(`${name}: has a subpath export with its types`, () => {
			const entry = pkg.exports[`./${name}`];
			assert.ok(entry, `exports["./${name}"]`);
			for (const file of [entry.import, entry.types]) assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), file);
			const types = readFileSync(new URL(`../${entry.types}`, import.meta.url), 'utf8');
			assert.match(types, new RegExp(`export declare const ${camel(name)}: SceneDefinition;`));
		});
	}
});

describe('the package', () => {
	it('declares the scene names in its types', () => {
		const types = readFileSync(new URL('../src/index.d.ts', import.meta.url), 'utf8');
		const union = types.slice(types.indexOf('export type SceneName'), types.indexOf(';', types.indexOf('export type SceneName')));
		assert.deepEqual([...union.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]), ORDER);
	});

	it('exports the index, core and load, and is free of side effects and dependencies', () => {
		for (const key of ['.', './core', './load']) assert.ok(pkg.exports[key]?.import && pkg.exports[key]?.types, key);
		assert.equal(pkg.sideEffects, false);
		assert.equal(pkg.dependencies, undefined);
		assert.equal(pkg.version, '0.1.0');
		assert.equal(pkg.license, 'MIT');
	});

	it('keeps the scenes out of core: it imports no scene', () => {
		const core = readFileSync(new URL('../src/core.js', import.meta.url), 'utf8');
		assert.doesNotMatch(core, /from '\.\/scenes\//);
	});
});
