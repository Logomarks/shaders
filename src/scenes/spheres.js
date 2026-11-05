/**
 * @module @logomarks/shaders/spheres
 *
 * Pastel spheres: matte spheres floating at different depths, lit warm and cool, the far ones out of focus.
 *
 * Colours (c1–c3 are `colors`): c1 the warm bounce light, c2 the cool light, c3 the deep ambient, glint the soft white key.
 */

import { spheresShader } from './spheres-shader.js';
import { define } from '../define.js';

/** Pastel spheres. */
export const spheres = define({
	name: 'spheres',
	title: 'Pastel spheres',
	description: 'Matte spheres floating at different depths, lit warm and cool, the far ones out of focus.',
	scale: 0.5,
	ground: '#060608',
	look: { colors: ['#fa8c61', '#4099f2', '#0d0f29'], glint: '#ede6f5' },
	params: [
		{ key: 'count', label: 'Count', min: 2, max: 24, step: 1, default: 16 },
		{ key: 'size', label: 'Size', min: 0.15, max: 0.7, step: 0.01, default: 0.36 },
		{ key: 'focus', label: 'Focus', min: 0, max: 1, step: 0.01, default: 0.25 },
		{ key: 'blur', label: 'Blur', min: 0, max: 0.3, step: 0.005, default: 0.11 },
		{ key: 'drift', label: 'Drift', min: 0, max: 0.12, step: 0.005, default: 0.035 },
	],
	fragment: spheresShader(3),
});

export default spheres;
