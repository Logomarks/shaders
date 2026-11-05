/**
 * @module @logomarks/shaders/topo
 *
 * Topographic: contour lines of slowly shifting ground, every few an index line in the first colour.
 *
 * Colours (c1–c3 are `colors`): c1 the index lines, c2 the other lines, c3 the ground (kept dark). The glint isn't used.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Topographic. */
export const topo = define({
	name: 'topo',
	title: 'Topographic',
	description: 'Contour lines of slowly shifting ground, every few an index line in the first colour.',
	scale: 0.6,
	ground: '#060608',
	look: { colors: ['#d4ff3b', '#6b706b', '#0d0f0d'], glint: '#ffffff' },
	params: [
		{ key: 'lines', label: 'Lines', min: 6, max: 70, step: 1, default: 26 },
		{ key: 'every', label: 'Index every', min: 0, max: 10, step: 1, default: 5 },
		{ key: 'scale', label: 'Scale', min: 0.5, max: 4, step: 0.05, default: 1.6 },
		{ key: 'detail', label: 'Detail', min: 0, max: 1, step: 0.01, default: 0.35 },
	],
	fragment: `${HEAD}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.03;
	float h = fbm(uv * uP[2] + vec2(t, -t * 0.7)) + uP[3] * fbm(uv * uP[2] * 2.19 - t * 1.3);
	float n = h * uP[0];
	float fw = fwidth(n);
	float line = 1.0 - smoothstep(0.0, fw * 1.4, abs(fract(n - 0.5) - 0.5));
	float every = floor(uP[1] + 0.5);
	float major = every > 0.5 ? step(mod(floor(n + 0.5) + 0.5, every), 1.0) : 0.0;   // every Nth (none at 0)
	vec3 ground = lower(uC3, 0.06);
	vec3 col = mix(ground * 0.6, ground, h);
	col = mix(col, mix(lift(uC2, 0.25), lift(uC1, 0.45), major), line * (0.55 + 0.45 * major));
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default topo;
