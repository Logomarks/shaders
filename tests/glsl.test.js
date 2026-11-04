/**
 * @arraypress/shaders — every scene's fragment shader parses as GLSL ES
 * 3.00 (with @shaderfrog/glsl-parser: syntax, and every function and
 * variable declared before use), with no GPU. The browser check
 * (scripts/browser-check.mjs) compiles and draws them for real.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parser } from '@shaderfrog/glsl-parser/index.js';
import { preprocess } from '@shaderfrog/glsl-parser/preprocessor/index.js';
import { SCENES, definition, marble } from '../src/index.js';

/**
 * The parser's own mistakes, by scene: warnings about code that is valid GLSL.
 * `tiles` declares `fw, ri, up` in one statement, `up` using `ri`; the parser
 * scopes a declarator only after the whole statement.
 */
const PARSER_MISTAKES = /** @type {Record<string, string[]>} */ ({ tiles: ['Encountered undefined variable: "ri"', 'Encountered duplicate variable declaration: "ri"'] });

/**
 * Parses a shader and returns the parser's warnings (undeclared names and the like).
 *
 * @param {string} source The shader.
 * @returns {string[]} Its warnings.
 * @throws {Error} On a syntax error.
 */
function parse(source) {
	const warnings = /** @type {string[]} */ ([]);
	const warn = console.warn;
	console.warn = (/** @type {unknown[]} */ ...args) => warnings.push(args.map(String).join(' ').replace(/^Warning:\s*/, ''));
	try {
		parser.parse(preprocess(source), { quiet: false, stage: 'fragment', failOnWarn: false });
	} finally {
		console.warn = warn;
	}
	return warnings;
}

describe('every shader parses', () => {
	for (const name of Object.keys(SCENES)) {
		it(name, () => {
			const warnings = parse(definition(name).fragment);
			assert.deepEqual(
				warnings.filter((w) => !(PARSER_MISTAKES[name] ?? []).some((m) => w.includes(m))),
				[],
			);
		});
	}
});

describe('the check catches mistakes', () => {
	it('a syntax error', () => {
		assert.throws(() => parse(marble.fragment.replace('float h = height(p, t);', 'float h = height(p, t)')));
	});

	it('an undeclared function or variable', () => {
		assert.notDeepEqual(parse(marble.fragment.replace('float h = height(p, t);', 'float h = heigt(p, t);')), []);
		assert.notDeepEqual(parse(marble.fragment.replace('vec2 p = uv * uP[0];', 'vec2 p = uvv * uP[0];')), []);
	});
});
