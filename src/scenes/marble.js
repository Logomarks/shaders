/**
 * @module @arraypress/shaders/marble
 *
 * Liquid marble: a flowing glassy liquid reflecting big panels of colour, with sharp highlights and dark creases where it folds.
 *
 * Colours (c1–c3 are `colors`): c1 the hot panel (and, paled, the peach one), c2 the deep panel and the thin glass, c3 the accent panel, glint the pale panel (and the crease tint).
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Liquid marble. */
export const marble = define({
	name: 'marble',
	title: 'Liquid marble',
	description: 'A flowing glassy liquid reflecting big panels of colour, with sharp highlights and dark creases where it folds.',
	scale: 0.5,
	ground: '#060608',
	look: { colors: ['#ff5c2e', '#14477a', '#eb4d8c'], glint: '#bfdbf2' },
	params: [
		{ key: 'scale', label: 'Scale', min: 0.4, max: 2.5, step: 0.02, default: 1.1 },
		{ key: 'sharpness', label: 'Sharpness', min: 0.3, max: 1.3, step: 0.02, default: 0.8 },
		{ key: 'warp', label: 'Warp', min: 0, max: 4, step: 0.05, default: 1.8 },
		{ key: 'relief', label: 'Relief', min: 0.15, max: 1.5, step: 0.01, default: 0.6 },
	],
	fragment: `${HEAD}
// a smoother noise (fewer octaves): big glass forms, not ripples
float soft(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * noise(p); p = rot(0.6) * p * 2.02; a *= 0.5; } return s / 0.875; }
float height(vec2 p, float t) {
	vec2 q = vec2(soft(p + vec2(0.0, t)), soft(p + vec2(5.2, -t * 0.8)));
	float h = soft(p * 0.9 + uP[2] * q + vec2(t * 0.3, 0.0));
	return 1.0 - pow(abs(h * 2.0 - 1.0), uP[1]);                            // ridged: glass folds into crisp creases
}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.05;
	vec2 p = uv * uP[0];
	float h = height(p, t);
	vec2 e = vec2(0.006, 0.0);
	vec2 g = vec2(height(p + e.xy, t) - height(p - e.xy, t), height(p + e.yx, t) - height(p - e.yx, t)) / (2.0 * e.x);
	vec3 n = normalize(vec3(-g * uP[3], 1.0));
	vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
	vec3 HOT = lift(uC1, 0.35), DEEP = lower(uC2, 0.3), ACC = lift(uC3, 0.35), PALE = lift(uC4, 0.75);
	// what the glass reflects: a studio of big colour panels (pale, peach, hot, deep, accent)
	float up = r.z;
	// smooth bands by direction (not by angle, which spins wildly where the glass faces you)
	vec3 env = mix(PALE, mix(HOT, vec3(1.0), 0.55), smoothstep(-0.25, 0.45, r.x + 0.3 * r.y));
	env = mix(env, HOT, smoothstep(0.25, 0.6, -r.x + 0.25 * r.y) * 0.85);
	env = mix(env, DEEP, smoothstep(0.2, 0.55, -r.y) * 0.85);
	env = mix(env, ACC, smoothstep(0.35, 0.7, r.y - r.x) * 0.5);
	float fres = 0.45 + 0.55 * pow(1.0 - up, 1.6);
	env = mix(env, env * env * 1.3, 0.5);                                   // richer reflections
	vec3 col = mix(mix(DEEP, PALE, 0.7), env, fres);
	col = mix(col, DEEP * 1.1, smoothstep(0.35, 0.15, h) * 0.55);          // deep glass where it's thin
	// highlights and the glass's dark seams where it folds hard
	col += vec3(1.0) * pow(max(dot(r, normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 90.0) * 1.3;   // a sharp studio glint
	col += vec3(1.0) * pow(max(dot(r, normalize(vec3(0.5, -0.3, 0.8))), 0.0), 60.0) * 0.6;
	float fold = length(g);
	// the creases: a hair-fine bright line on the crest, dark glass either side
	col += vec3(0.95, 0.97, 1.0) * smoothstep(0.93, 0.99, h) * 0.7;
	col *= 1.0 - smoothstep(2.2, 4.5, fold) * 0.55;
	vec3 ct = vivid(PALE, 1.0);
	col = mix(col, col * ct * ct, smoothstep(0.86, 0.95, h) * smoothstep(1.0, 0.97, h) * 0.6);
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default marble;
