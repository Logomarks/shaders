/**
 * @module @arraypress/shaders/foil
 *
 * Holographic foil: rainbow foil with fine diffraction lines and winking glitter that shift as the pointer tilts it.
 *
 * Colours (c1–c3 are `colors`): c1–c3 the sheen's colours, looped (#ff4242, #403dff, #40ff3d make the rainbow), glint the light catching it and the glitter.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Holographic foil. */
export const foil = define({
	name: 'foil',
	title: 'Holographic foil',
	description: 'Rainbow foil with fine diffraction lines and winking glitter that shift as the pointer tilts it.',
	scale: 0.55,
	ground: '#a3a6ae',
	look: { colors: ['#ff4242', '#403dff', '#40ff3d'], glint: '#ffffff' },
	params: [
		{ key: 'lines', label: 'Lines', min: 0, max: 2000, step: 10, default: 900 },
		{ key: 'bands', label: 'Bands', min: 0.3, max: 3, step: 0.02, default: 1 },
		{ key: 'warp', label: 'Warp', min: 0, max: 3, step: 0.05, default: 1.2 },
		{ key: 'glitter', label: 'Glitter', min: 0, max: 0.05, step: 0.002, default: 0.015 },
		{ key: 'sheen', label: 'Sheen', min: 0, max: 0.8, step: 0.01, default: 0.35 },
	],
	fragment: `${HEAD}
void main() {
	vec2 uv = gl_FragCoord.xy / uRes;
	vec2 tilt = (uMouse - 0.5) * 1.4 + 0.12 * vec2(sin(uTime * 0.4), cos(uTime * 0.33));
	float w = fbm(uv * 3.0 + tilt * 0.5) * uP[2];
	float phase = (uv.x * 1.6 + uv.y * 1.1) * uP[1] + tilt.x * 1.3 - tilt.y * 0.9 + w;
	vec3 rainbow = loop3(vivid(uC1, 0.8), vivid(uC2, 0.8), vivid(uC3, 0.8), phase);
	vec3 G = lift(uC4, 0.75);
	// silver base, a broad sheen where the light catches
	float sheen = exp(-pow((uv.x + uv.y - 1.0 - tilt.x * 0.8) * 2.4, 2.0));
	vec3 col = mix(vec3(0.62, 0.64, 0.7), rainbow, 0.55 + 0.25 * sheen);
	col = mix(col * 0.7, G, sheen * uP[4]);
	// diffraction grating: fine diagonal lines
	col *= 0.9 + 0.1 * sin((uv.x - uv.y) * uP[0] + tilt.x * 40.0);
	// glitter: cells that wink as the angle changes
	vec2 g = floor(gl_FragCoord.xy / 3.0);
	float sp = hash(g);
	col += G * step(1.0 - uP[3], sp) * pow(0.5 + 0.5 * sin(sp * 60.0 + (tilt.x + tilt.y) * 25.0 + uTime), 12.0) * 1.5;
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default foil;
