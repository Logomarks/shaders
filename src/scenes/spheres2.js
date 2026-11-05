/**
 * @module @logomarks/shaders/spheres2
 *
 * Pastel spheres, close: fewer, bigger, nearer spheres, in pinker light.
 *
 * Colours (c1–c3 are `colors`): c1 the warm bounce light, c2 the cool light, c3 the deep ambient, glint the soft white key.
 */

import { spheresShader } from './spheres-shader.js';
import { define } from '../define.js';

/** Pastel spheres, close. */
export const spheres2 = define({
	name: 'spheres2',
	title: 'Pastel spheres, close',
	description: 'Fewer, bigger, nearer spheres, in pinker light.',
	scale: 0.5,
	ground: '#060608',
	look: { colors: ['#ff7366', '#3373ff', '#0f0a24'], glint: '#e0d9fa' },
	params: [
		{ key: 'count', label: 'Count', min: 2, max: 24, step: 1, default: 9 },
		{ key: 'size', label: 'Size', min: 0.15, max: 0.7, step: 0.01, default: 0.42 },
		{ key: 'focus', label: 'Focus', min: 0, max: 1, step: 0.01, default: 0.15 },
		{ key: 'blur', label: 'Blur', min: 0, max: 0.3, step: 0.005, default: 0.11 },
		{ key: 'drift', label: 'Drift', min: 0, max: 0.12, step: 0.005, default: 0.035 },
	],
	fragment: spheresShader(11),
});

export default spheres2;
