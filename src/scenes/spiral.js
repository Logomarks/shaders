/**
 * @module @logomarks/shaders/spiral
 *
 * Spiral trails: fine grooves sweeping round a slowly turning disc, light streaked along them.
 *
 * Colours (c1–c3 are `colors`): c1 the broad sweep, c2 the warm patch low left, c3 the dim rest of the disc, glint the bright glow low right.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Spiral trails. */
export const spiral = define({
	name: 'spiral',
	title: 'Spiral trails',
	description: 'Fine grooves sweeping round a slowly turning disc, light streaked along them.',
	scale: 0.6,
	ground: '#060608',
	look: { colors: ['#086b9e', '#ff6633', '#051a29'], glint: '#59e6ff' },
	params: [
		{ key: 'grooves', label: 'Grooves', min: 100, max: 1000, step: 5, default: 520 },
		{ key: 'depth', label: 'Groove depth', min: 0, max: 0.6, step: 0.01, default: 0.25 },
		{ key: 'streaks', label: 'Streaks', min: 0.5, max: 6, step: 0.1, default: 2.5 },
		{ key: 'patch', label: 'Patch', min: 0.4, max: 2, step: 0.02, default: 1 },
	],
	fragment: `${HEAD}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.05;
	vec3 SW = lift(uC1, 0.25), WP = lift(uC2, 0.45), DIM = lower(uC3, 0.1), GL = lift(uC4, 0.5);
	vec2 c = vec2(0.62, -0.7);
	vec2 d = uv - c;
	float r = length(d), th = atan(d.y, d.x) + t;                              // it turns slowly
	// light streaked along the grooves (blurred round, sharp across)
	float streak = noise(vec2(r * 90.0, th * uP[2])) * 0.6 + noise(vec2(r * 300.0, th * uP[2] * 2.4)) * 0.4;
	float grooves = (1.0 - uP[1]) + uP[1] * sin(r * uP[0] + noise(vec2(th * 3.0, r * 10.0)) * 3.0);
	// as in the photo: dark top left, the sweep through the middle and right, the warm patch low left of centre,
	// the glow at the bottom right
	float blue = exp(-pow((th - 1.75) * 1.25, 2.0)) * smoothstep(0.08, 0.4, r) * smoothstep(1.9, 0.9, r);
	vec2 s0 = sceneUv();
	float dark = smoothstep(-0.15, 0.35, s0.x * 0.8 - s0.y * 0.9 + 0.1);
	blue = max(blue, 0.0) * 0.5 + 0.8 * dark;
	vec2 gq = (s0 - vec2(0.36, -0.46)) * vec2(1.6, 2.2);
	float glow = exp(-dot(gq, gq) * 5.0);
	vec2 oq = (s0 - vec2(-0.12, -0.14)) * vec2(1.3, 3.2) / uP[3];
	float orange = exp(-dot(oq, oq) * 6.0);
	blue *= 1.0 - orange * 0.8;
	vec3 col = (SW * blue * 1.1 + GL * glow * 1.5 + WP * orange * 1.6) * streak * grooves;
	col += DIM * smoothstep(1.5, 0.4, r) * grooves * 0.6;   // the dim rest of the disc
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default spiral;
