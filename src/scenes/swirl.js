/**
 * @module @arraypress/shaders/swirl
 *
 * Glass swirl: a glass shell with a dark core; silk strands of thin-film colour flow round its rim, warm below and cold above.
 *
 * Colours (c1–c3 are `colors`): c1 the warm film (lower left), c2 the cold film and the core's reflection, c3 the deep red of the warm side, glint the shell's fine top edge.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Glass swirl. */
export const swirl = define({
	name: 'swirl',
	title: 'Glass swirl',
	description: 'A glass shell with a dark core; silk strands of thin-film colour flow round its rim, warm below and cold above.',
	scale: 0.5,
	ground: '#060608',
	look: { colors: ['#ff6b2e', '#296bf2', '#d91f33'], glint: '#8cd9ff' },
	params: [
		{ key: 'strands', label: 'Strands', min: 40, max: 260, step: 1, default: 140 },
		{ key: 'size', label: 'Size', min: 0.6, max: 1.4, step: 0.01, default: 1 },
		{ key: 'core', label: 'Core', min: 0.4, max: 1.6, step: 0.01, default: 1 },
		{ key: 'flow', label: 'Flow', min: 0, max: 3.5, step: 0.05, default: 1.6 },
		{ key: 'glow', label: 'Glow', min: 0.3, max: 2, step: 0.02, default: 1 },
	],
	fragment: `${HEAD}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.12;
	vec3 W = vivid(uC1, 0.9), B = vivid(uC2, 0.9), R = vivid(uC3, 0.8), G = lift(uC4, 0.6);
	// the whole shape drifts: it turns, shifts and swells, and its outline flows (slowly)
	vec2 p = rot(-0.22 + 0.18 * sin(t * 0.9)) * (uv - vec2(0.06 + 0.04 * sin(t * 0.7), 0.01 + 0.03 * cos(t * 0.6)));
	p /= uP[1];
	p += 0.06 * vec2(fbm(p * 1.8 + vec2(t * 0.6, 0.0)) - 0.5, fbm(p * 1.8 + vec2(0.0, -t * 0.5) + 4.0) - 0.5);
	p += 0.03 * vec2(sin(p.y * 3.0 + t * 2.0), cos(p.x * 2.6 - t * 1.7));
	p *= 1.0 + 0.06 * sin(t * 0.8);
	// the shell, an almond: fuller on the right, drawn to a point at the lower left
	vec2 ps = p; ps.x *= 1.0 + 0.28 * smoothstep(0.1, -0.5, p.x) * smoothstep(-0.05, 0.3, -p.y);
	float r1 = length(ps / vec2(0.5, 0.4));               // the shell: 1 at its edge
	vec2 q = rot(0.42 + 0.3 * sin(t * 0.55)) * (p - vec2(-0.03 + 0.05 * sin(t * 0.45), -0.02 + 0.03 * cos(t * 0.5)));
	float r2 = length(q / (vec2(0.25, 0.13) * uP[2] * (1.0 + vec2(0.18, 0.3) * sin(vec2(t * 0.6, t * 0.75)))));   // the dark core, breathing
	vec2 dir = normalize(p + 1e-4);
	float warm = smoothstep(0.55, -0.75, dot(dir, normalize(vec2(0.55, 0.85))));   // lower left is warm
	// strands: lines of a field that follows the core near it and the shell further out
	float k = exp(-max(r2 - 1.0, 0.0) * 1.3);
	float f = mix(r1, r2 * 0.55 + 0.42, k);
	float wob = fbm(p * 2.2 + vec2(t * 0.8, -t * 0.5)) * uP[3];
	float lines = 0.5 + 0.5 * sin(f * uP[0] + wob * 6.0 - t * 6.0);
	lines = pow(lines, 6.0) * 0.8 + 0.5 + 0.5 * sin(f * uP[0] * 0.2714 + wob * 3.0 - t * 3.0) * 0.35;
	// where the strands shine: the shell's rim, the core's rim, and the warm lower side between
	float inside = smoothstep(1.02, 0.97, r1);
	float rim = exp(-abs(r1 - 0.985) * 26.0);
	float coreRim = exp(-max(r2 - 1.0, 0.0) * 4.0) * smoothstep(0.9, 1.05, r2);
	float body = inside * smoothstep(1.0, 1.3, r2) * (0.08 + 0.92 * warm * warm) * smoothstep(0.25, 0.9, r1);
	// strands where the glass folds (the warm lip, round the core); smooth glass elsewhere
	float strandy = smoothstep(0.2, 0.8, warm);
	float glow = (rim * mix(0.55, 0.5 + 0.7 * lines, strandy) * (0.4 + 0.6 * warm) + coreRim * mix(0.6, 1.1 * lines, strandy) + body * (0.35 + 0.8 * lines * strandy)) * uP[4];
	// thin-film colour: the warm colours (c1 into c3, toward pink) on the warm side, the cold (c2 toward the glint)
	float h = f * 2.4 + wob * 0.35 + t * 0.4;
	vec3 hot = mix(W, R, 0.5 + 0.5 * sin(h * 3.0));
	hot = mix(hot, mix(R, vec3(1.0), 0.55), 0.35 * (0.5 + 0.5 * sin(h * 5.0 + 1.3)));
	vec3 cold = mix(B, mix(B, G, 0.85), 0.5 + 0.5 * sin(h * 3.0 + 0.7));
	vec3 film = mix(cold, hot, warm);
	vec3 col = vec3(0.0);
	// the shell's dark glass, a deep red glow low down, a cold sheen up high
	col += inside * mix(B * 0.05, R * 0.21, smoothstep(0.3, -0.6, p.y) * 0.7);
	col += inside * B * 0.21 * smoothstep(0.05, 0.45, p.y) * smoothstep(1.0, 0.6, r1) * (1.0 - warm);   // a smooth sheen up top
	// the core: dark, with a cold reflection along its lower edge
	float core = smoothstep(1.02, 0.96, r2);
	vec3 coreCol = mix(B * 0.03, B * 0.74, smoothstep(-0.6, 0.9, -q.y * 3.0 + q.x) * smoothstep(0.2, 1.0, r2));
	col = mix(col, coreCol, core);
	col += film * glow;
	// the shell's top edge: a fine bright line in the glint; its lower edge: a broad warm bloom
	col += G * exp(-abs(r1 - 1.0) * 120.0) * smoothstep(-0.2, 0.6, dot(dir, vec2(0.3, 0.95)));
	col += mix(W, vec3(1.0), 0.25) * exp(-abs(r1 - 1.0) * 14.0) * warm * 0.35;
	// a little warm light spilled outside, below
	col += mix(W, R, 0.5) * 0.27 * (1.0 - inside) * exp(-max(r1 - 1.0, 0.0) * 5.0) * warm * 0.6;
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default swirl;
