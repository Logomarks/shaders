/**
 * @module @arraypress/shaders/ink-water
 *
 * Ink in water: ink clouds blooming and curling through a pale tank.
 *
 * Colours (c1–c3 are `colors`): c1 the ink, c2 its second colour (where it curls), c3 the densest ink, glint the water (kept pale).
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Ink in water. */
export const inkWater = define({
	name: 'ink-water',
	title: 'Ink in water',
	description: 'Ink clouds blooming and curling through a pale tank.',
	scale: 0.45,
	ground: '#e8ecf1',
	look: { colors: ['#0d1461', '#990f61', '#050514'], glint: '#d1dbeb' },
	params: [
		{ key: 'amount', label: 'Amount', min: 0.4, max: 1.35, step: 0.01, default: 1 },
		{ key: 'curl', label: 'Curl', min: 0, max: 6, step: 0.05, default: 3 },
		{ key: 'scale', label: 'Scale', min: 0.6, max: 5, step: 0.05, default: 2 },
		{ key: 'softness', label: 'Softness', min: 0.15, max: 0.8, step: 0.01, default: 0.43 },
	],
	fragment: `${HEAD}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.07;
	vec2 sp = uv * uP[2];
	// warped twice over: the curl of real ink
	vec2 q = vec2(fbm(sp + vec2(0.0, t)), fbm(sp + vec2(5.2, 1.3 - t)));
	vec2 r = vec2(fbm(sp + uP[1] * q + vec2(1.7, 9.2) + t * 0.8), fbm(sp + uP[1] * q + vec2(8.3, 2.8) - t * 0.6));
	float f = fbm(sp * 0.8 + 3.2 * r);
	// the ink falls from the top and spreads as it goes
	float fall = smoothstep(-0.7, 0.55, uv.y + 0.25 * sin(t * 3.0));
	float dens = smoothstep(0.42, 0.42 + uP[3], f * (0.6 + 0.6 * fall) * uP[0]);
	vec3 W = lift(uC4, 0.8);
	float chroma = max(W.r, max(W.g, W.b)) - min(W.r, min(W.g, W.b));
	W = mix(vec3(luma(W)), W, min(1.0, 0.12 / max(chroma, 1e-3)));   // only a tint
	vec3 water = mix(mix(W, vec3(1.0), 0.45), W, uv.y + 0.5);
	vec3 inkCol = mix(lower(uC1, 0.3), lower(uC2, 0.3), smoothstep(0.2, 0.8, r.x));
	inkCol = mix(inkCol, lower(uC3, 0.04), smoothstep(0.7, 1.0, dens));
	vec3 col = mix(water, inkCol, dens);
	// thin wisps at the edges of the cloud
	col = mix(col, inkCol * 1.2, smoothstep(0.02, 0.0, abs(f - 0.5)) * 0.25 * fall);
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default inkWater;
