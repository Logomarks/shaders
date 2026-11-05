/**
 * @module @logomarks/shaders/rings
 *
 * Glass rings: concentric glass arcs rippling outward, warm on one side and cold on the other, a glint travelling round each.
 *
 * Colours (c1–c3 are `colors`): c1 the warm side, c2 the cold side, c3 the warm side's second colour, glint the travelling glint.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Glass rings. */
export const rings = define({
	name: 'rings',
	title: 'Glass rings',
	description: 'Concentric glass arcs rippling outward, warm on one side and cold on the other, a glint travelling round each.',
	scale: 0.6,
	ground: '#060608',
	look: { colors: ['#ff6126', '#2673ff', '#e6334d'], glint: '#fff2e6' },
	params: [
		{ key: 'rings', label: 'Rings', min: 2, max: 12, step: 0.1, default: 4.6 },
		{ key: 'wobble', label: 'Wobble', min: 0, max: 0.02, step: 0.0005, default: 0.004 },
		{ key: 'glints', label: 'Glints', min: 1, max: 8, step: 1, default: 3 },
		{ key: 'brush', label: 'Brush', min: 0, max: 0.4, step: 0.01, default: 0.12 },
	],
	fragment: `${HEAD}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.07;
	vec3 A = vivid(uC1, 0.9), Cb = vivid(uC2, 0.9), Rr = vivid(uC3, 0.8), G = lift(uC4, 0.7);
	vec3 Cd = mix(Cb, Cb * Cb, 0.5);                  // the cold colour, deeper (for the glass's body)
	vec2 c = vec2(0.85, -0.55);                       // the rings' centre, off the bottom right
	vec2 d = uv - c;
	float r = length(d), th = atan(d.y, d.x);
	// the rings drift outward, like a slow ripple; a little wobble so they're glass, not lines
	float wob = uP[1] * sin(th * 7.0 + t * 7.0);
	float s = (r + wob) * uP[0] - t * 1.4;
	float ring = fract(s), id = floor(s);
	// a glass tube's profile: a thin bright inner lip, a softly lit body, a dark gap
	float lip = exp(-ring * 38.0) + 0.6 * exp(-(1.0 - ring) * 60.0);
	float bodyL = smoothstep(0.05, 0.35, ring) * smoothstep(0.95, 0.55, ring);
	// warm where the rings face up and left, cold below and right; the hue turns slowly
	float side = smoothstep(-0.2, 0.9, sin(th - 2.2 + 0.25 * sin(t * 2.0 + id)));
	vec3 warm = mix(A, Rr, 0.5 + 0.5 * sin(id * 1.7 + t * 3.0));
	vec3 cold = mix(Cb, mix(Cb, vec3(1.0), 0.4), 0.5 + 0.5 * sin(id * 2.3 + t * 2.0));
	vec3 tint = mix(cold, warm, side);
	// fine brushed lines across each ring (the photo's grain of the glass)
	float brush = (1.0 - uP[3]) + uP[3] * sin(th * 420.0 + r * 60.0) * smoothstep(0.3, -0.6, uv.x);
	float fade = smoothstep(2.2, 0.6, r) * smoothstep(0.08, 0.3, r);
	// small hot spots where each ring meets the bottom of the frame, drifting a little
	float dh = abs(mod(th - (2.97 + 0.06 * sin(id * 1.7 + t * 2.0)) + 3.14159, 6.28318) - 3.14159);
	float hot = exp(-pow(dh / 0.2, 2.0)) * exp(-pow((ring - 0.42) / 0.1, 2.0));   // long along the ring, narrow across it
	// the tube's body: dark glass with a cold reflection up its middle
	float streak = exp(-pow((ring - 0.5) / 0.16, 2.0)) * (0.35 + 0.65 * pow(0.5 + 0.5 * sin(th * 2.2 + id * 0.9 - t * 3.0), 2.0));
	vec3 blue = mix(Cd * 0.9, mix(Cb, vec3(1.0), 0.35), 0.5 + 0.5 * sin(id * 1.3 + t));
	// reflections across the tube: light and dark bands, warm on the warm side, cold on the cold
	float refl = 0.5 + 0.5 * sin(ring * 18.0 + th * 3.0 + id * 2.1 - t * 2.0);
	vec3 reflCol = mix(mix(Cd * 0.85, Rr * 0.83, side), mix(Cd * 0.18, Rr * 0.22, side), refl);
	vec3 col = reflCol * bodyL * 0.45 * fade + (mix(tint, vec3(1.0), 0.3) * lip * 1.3 + blue * streak * (0.45 + 1.3 * smoothstep(1.3, 0.35, r)) * (1.0 - side * 0.5) + warm * streak * 0.35 * side + mix(A, G, 0.15) * hot * 1.8) * brush * fade;
	// a glint travelling round each ring
	col += G * exp(-ring * 60.0) * pow(0.5 + 0.5 * sin(th * uP[2] - t * 9.0 + id * 1.3), 24.0) * fade * 1.2;
	col += (hash(gl_FragCoord.xy * 1.1 + fract(uTime) * 53.0) - 0.5) * 0.05;          // a little grain
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default rings;
