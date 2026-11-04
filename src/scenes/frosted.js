/**
 * @module @arraypress/shaders/frosted
 *
 * Frosted glass: fluted glass bending soft orbs of colour that drift behind it, colour splitting at each flute's edge.
 *
 * Colours (c1–c3 are `colors`): c1, c2, c3 soft orbs drifting behind the glass (c2 and c3 also the ground), glint the studio it reflects.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Frosted glass. */
export const frosted = define({
	name: 'frosted',
	title: 'Frosted glass',
	description: 'Fluted glass bending soft orbs of colour that drift behind it, colour splitting at each flute\'s edge.',
	scale: 0.45,
	ground: '#060608',
	look: { colors: ['#ff4f7b', '#4b5dff', '#ffb23e'], glint: '#ffffff', angle: 128, grain: 0.2 },
	params: [
		{ key: 'flutes', label: 'Flutes', min: 3, max: 30, step: 1, default: 13 },
		{ key: 'depth', label: 'Depth', min: 0, max: 0.45, step: 0.005, default: 0.17 },
		{ key: 'frost', label: 'Frost', min: 0, max: 0.06, step: 0.001, default: 0.014 },
		{ key: 'dispersion', label: 'Dispersion', min: 0, max: 3, step: 0.05, default: 1 },
		{ key: 'roundness', label: 'Roundness', min: 0.2, max: 0.99, step: 0.01, default: 0.92 },
	],
	fragment: `${HEAD}
// what's behind the glass, a little way back: soft orbs of the palette drifting over a dark ground
vec3 behind(vec2 p, float t) {
	vec3 c = mix(uC3 * 0.05 + 0.01, uC2 * 0.14 + 0.015, smoothstep(-0.7, 0.7, p.y));
	vec2 a = vec2(0.22 * sin(t * 0.9), 0.06 + 0.18 * cos(t * 0.7));
	vec2 b = vec2(-0.25 * cos(t * 0.6), -0.2 + 0.08 * sin(t * 0.8));
	vec2 d = vec2(0.28 * sin(t * 0.5 + 2.0), -0.3 * sin(t * 0.45) + 0.1);
	c += uC1 * 1.15 * exp(-dot(p - a, p - a) * 9.0);
	c += uC2 * 1.0 * exp(-dot(p - b, p - b) * 7.0);
	c += uC3 * 0.95 * exp(-dot(p - d, p - d) * 13.0);
	return c;
}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.35;
	float lx = fract(uv.x * uP[0]) * 2.0 - 1.0;                   // -1 … 1 across each flute
	// each flute: a half-cylinder of glass facing out (rounder or flatter); its normal
	float R = uP[4];
	vec3 n = normalize(vec3(lx * R, 0.0, sqrt(max(1.0 - R * R * lx * lx, 0.0))));
	vec3 v = vec3(0.0, 0.0, -1.0);
	float depth = uP[1];                                             // from the glass to what's behind it
	// refraction, one ray per colour (glass bends blue the most), each a few jittered looks for the frost
	vec3 rr = refract(v, n, 1.0 / (1.5 - 0.04 * uP[3])), rg = refract(v, n, 1.0 / 1.5), rb = refract(v, n, 1.0 / (1.5 + 0.05 * uP[3]));
	vec2 orr = rr.xy / -rr.z * depth, org = rg.xy / -rg.z * depth, orb = rb.xy / -rb.z * depth;
	vec3 col = vec3(0.0);
	for (int i = 0; i < 3; i++) {
		vec2 j = (vec2(hash(gl_FragCoord.xy + float(i) * 7.1), hash(gl_FragCoord.yx + float(i) * 3.3)) - 0.5) * uP[2];
		col += vec3(behind(uv + orr + j, t).r, behind(uv + org + j, t).g, behind(uv + orb + j, t).b);
	}
	col /= 3.0;
	// the front face: a little of the room reflected everywhere, much more toward each flute's edge (Fresnel)
	float F = 0.04 + 0.96 * pow(1.0 - n.z, 5.0);
	vec3 refl = glassRoom(reflect(v, n));
	col = col * (1.0 - F) + refl * (F + 0.035);
	// where two flutes meet: a dark seam (the glass turns away), with a fine bright line inside it
	float edge = abs(lx);
	col *= 0.25 + 0.75 * smoothstep(1.0, 0.9, edge);
	col += lift(uC4, 0.7) * vec3(0.9, 0.93, 1.0) * exp(-(1.0 - edge) * 60.0) * 0.12;
	col = col / (1.0 + col * 0.35);                                   // a soft roll-off, no blown whites
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default frosted;
