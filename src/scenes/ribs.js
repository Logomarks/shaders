/**
 * @module @logomarks/shaders/ribs
 *
 * Ribbed light: fine stripes of light through ribbed glass, bent by big slow folds and lit in patches.
 *
 * Colours (c1–c3 are `colors`): c1 the main light, c2 the deeper light, c3 a drifting accent glow, glint the studio the glass reflects.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Ribbed light. */
export const ribs = define({
	name: 'ribs',
	title: 'Ribbed light',
	description: 'Fine stripes of light through ribbed glass, bent by big slow folds and lit in patches.',
	scale: 0.5,
	ground: '#060608',
	look: { colors: ['#58b0ff', '#1546c8', '#bfe6ff'], glint: '#ffffff' },
	params: [
		{ key: 'ribs', label: 'Ribs', min: 24, max: 160, step: 1, default: 96 },
		{ key: 'bend', label: 'Bend', min: 0, max: 2.5, step: 0.02, default: 1 },
		{ key: 'patches', label: 'Patches', min: 0.05, max: 0.42, step: 0.01, default: 0.28 },
		{ key: 'depth', label: 'Depth', min: 0, max: 0.15, step: 0.005, default: 0.05 },
		{ key: 'dispersion', label: 'Dispersion', min: 0, max: 3, step: 0.05, default: 1 },
	],
	fragment: `${HEAD}
// the light behind the ribbed glass: palette colours drifting, lit in patches, a diagonal band of shadow across
vec3 light(vec2 p, float t) {
	// mostly dark: the light falls in patches (the main colour, deepening to the second), an accent glow drifting
	float patchy = smoothstep(uP[2], uP[2] + 0.32, fbm(p * 1.5 + vec2(t * 0.25, -t * 0.18)));
	vec3 c = mix(lift(uC2, 0.2), lift(uC1, 0.45), smoothstep(0.4, 0.9, patchy)) * patchy * 2.0;
	vec2 q = p - vec2(0.22 * sin(t * 0.7), 0.15 + 0.1 * cos(t * 0.5));
	c += lift(uC3, 0.45) * exp(-dot(q, q) * 9.0) * 0.5 * patchy;
	float shadow = smoothstep(0.05, 0.25, abs(dot(p, normalize(vec2(0.75, 0.66))) + 0.06 * sin(t + p.y * 3.0) - 0.02));
	return c * (0.03 + 0.97 * shadow);
}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.12;
	// the ribs run nearly upright; big slow S-curves bend them, more in some places than others
	vec2 p = rot(-0.12) * uv;
	float fold = (0.11 * sin(p.y * 4.2 + t * 1.6 + p.x * 2.0) + 0.06 * sin(p.y * 7.0 - t * 1.2 + 1.3) + 0.05 * (fbm(p * 1.8 + t * 0.3) - 0.5)) * uP[1];
	float u = p.x + fold * (0.6 + 0.8 * smoothstep(-0.4, 0.4, sin(p.x * 3.0 + t * 0.5)));
	// each rib a rounded ridge of glass: its slope across, and so its normal
	float ph = u * uP[0];
	float slope = cos(ph) * 0.75;
	vec3 n = normalize(vec3(rot(0.12) * vec2(-slope, 0.0), 1.0));
	vec3 v = vec3(0.0, 0.0, -1.0);
	float depth = uP[3];
	vec3 rr = refract(v, n, 1.0 / (1.5 - 0.04 * uP[4])), rg = refract(v, n, 1.0 / 1.5), rb = refract(v, n, 1.0 / (1.5 + 0.05 * uP[4]));
	vec3 col = vec3(light(uv + rr.xy / -rr.z * depth, t).r, light(uv + rg.xy / -rg.z * depth, t).g, light(uv + rb.xy / -rb.z * depth, t).b);
	// light gathers where the ribs focus it (their crests) and thins in the troughs
	float crest = 0.5 + 0.5 * sin(ph);
	col *= 0.08 + 1.2 * crest * crest;                                         // focused on the crests, dark between
	float F = 0.04 + 0.96 * pow(1.0 - n.z, 5.0);
	col = col * (1.0 - F) + glassRoom(reflect(v, n)) * F * 0.5;
	col = col / (1.0 + col * 0.3);
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default ribs;
