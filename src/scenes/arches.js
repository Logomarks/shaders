/**
 * @module @arraypress/shaders/arches
 *
 * Arches: nested rounded arches stepping out from a corner, each lit at its rim; the steps breathe.
 *
 * Colours (c1–c3 are `colors`): c1 each layer's body, c2 its pale inner rim, c3 the deep it darkens to, glint the fine bright rim line.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Arches. */
export const arches = define({
	name: 'arches',
	title: 'Arches',
	description: 'Nested rounded arches stepping out from a corner, each lit at its rim; the steps breathe.',
	scale: 0.7,
	ground: '#060608',
	look: { colors: ['#1a4df2', '#adc7ff', '#050f66'], glint: '#cce0ff' },
	params: [
		{ key: 'steps', label: 'Steps', min: 0.8, max: 6, step: 0.05, default: 2.3 },
		{ key: 'spread', label: 'Spread', min: 0.4, max: 1.3, step: 0.01, default: 0.75 },
		{ key: 'width', label: 'Width', min: 0.02, max: 0.5, step: 0.01, default: 0.2 },
		{ key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 1 },
		{ key: 'rim', label: 'Rim', min: 0, max: 2.5, step: 0.05, default: 1 },
	],
	fragment: `${HEAD}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.15;
	// tall arches: rounded boxes standing on the bottom right, their sides running up out of the frame
	vec2 c = vec2(0.3, -0.62);
	float d = max(sdRoundRect(uv - c + vec2(0.0, 0.9), vec2(uP[2], 1.0), uP[3] * uP[2]), 0.0);   // wide tops with rounded corners, sides running down
	// the steps widen as they go out, and breathe
	float s = pow(d * 3.0, uP[1]) * (uP[0] + 0.12 * sin(t * 1.3));
	float n = floor(s), f = fract(s);
	vec3 deep = lower(uC3, 0.1), mid = vivid(uC1, 0.6), pale = lift(uC2, 0.7);
	// each layer pale at its inner rim, deepening outward; darker toward the outside of the set
	vec3 layer = mix(mix(pale, mid, smoothstep(0.0, 0.3, f)), deep, smoothstep(0.25, 1.0, f));
	layer *= mix(1.0, 0.5, smoothstep(0.0, 7.0, n));
	// the light from up and left, sliding slowly
	vec2 L = normalize(vec2(-0.7 + 0.25 * sin(t), 0.7));
	float facing = max(dot(normalize(uv - c + vec2(0.0, -0.4) + 1e-4), L), 0.0);
	layer *= 0.65 + 0.5 * facing;
	// a fine bright rim at each step, drawn smoothly (no stair-stepping)
	float aa = fwidth(s) * 1.5;
	layer += lift(uC4, 0.8) * uP[4] * (1.0 - smoothstep(0.0, aa + 0.02, f)) * (0.4 + 0.6 * facing);
	layer = mix(layer, layer * 0.55, smoothstep(1.0 - aa, 1.0, f));      // the shade where the next layer starts
	o = vec4(finish(layer, gl_FragCoord.xy), 1.0);
}`,
});

export default arches;
