/**
 * @module @logomarks/shaders/blob
 *
 * Pastel blob: a soft iridescent glass blob on a pale ground, budding and merging as it morphs.
 *
 * Colours (c1–c3 are `colors`): c1 the hot side (right), c2 the cool side low left (and, deepened, the core), c3 the accent low down, glint the silvery body. The ground stays a neutral pale.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Pastel blob. */
export const blob = define({
	name: 'blob',
	title: 'Pastel blob',
	description: 'A soft iridescent glass blob on a pale ground, budding and merging as it morphs.',
	scale: 0.5,
	ground: '#ece7e6',
	look: { colors: ['#ff382e', '#59b3ff', '#eb59b3'], glint: '#bdd6db' },
	params: [
		{ key: 'count', label: 'Lobes', min: 1, max: 8, step: 1, default: 6 },
		{ key: 'size', label: 'Size', min: 0.5, max: 1.8, step: 0.01, default: 1 },
		{ key: 'buds', label: 'Buds', min: 0.3, max: 2, step: 0.01, default: 1 },
		{ key: 'wander', label: 'Wander', min: 0, max: 1.8, step: 0.02, default: 1 },
	],
	fragment: `${HEAD}
// several lobes (Gaussian, so no spikes): one big and slow near the middle, smaller ones drifting round it on their
// own paths, so they pull out, bud off on their own and merge back in
vec2 lobe(int i, float t) {
	float fi = float(i);
	if (i == 0) return vec2(0.03 * sin(t * 0.7), 0.02 * cos(t * 0.6));
	return uP[3] * vec2(0.27 * sin(t * (0.55 + 0.12 * fi) + fi * 2.4), 0.23 * cos(t * (0.47 + 0.1 * fi) + fi * 1.3));
}
float field(vec2 p, float t) {
	float s = 0.0;
	int N = int(uP[0] + 0.5);
	for (int i = 0; i < 8; i++) {
		if (i >= N) break;
		float fi = float(i);
		float w = i == 0 ? 0.04 * uP[1] * uP[1] : (0.009 + 0.012 * fract(fi * 0.618 + 0.2)) * uP[2] * uP[2];   // spread (its radius at the edge ~ sqrt(0.8 w))
		vec2 d = p - lobe(i, t);
		s += exp(-dot(d, d) / w);
	}
	return s;
}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.25;
	vec3 HOT = lift(uC1, 0.4), COOL = lift(uC2, 0.45), ACC = lift(uC3, 0.45), SILVER = lift(uC4, 0.7);
	vec3 bg = mix(vec3(0.94, 0.9, 0.88), vec3(0.9, 0.9, 0.94), uv.y + 0.5);
	float f = field(uv, t);
	float inside = smoothstep(0.42, 0.46, f);
	vec2 e = vec2(0.003, 0.0);
	vec2 g = vec2(field(uv + e.xy, t) - field(uv - e.xy, t), field(uv + e.yx, t) - field(uv - e.yx, t)) / (2.0 * e.x);
	vec3 n = normalize(vec3(-g * 0.16, 1.0));
	float fres = pow(1.0 - n.z, 1.2);
	// across it: silvery on the left, a paled hot to the full hot colour on the right, cool and accent low down
	vec3 body = mix(SILVER, mix(HOT, vec3(1.0), 0.33), smoothstep(-0.15, 0.35, uv.x));
	body = mix(body, HOT, smoothstep(0.05, 0.4, uv.x) * (0.4 + 0.8 * fres));
	body = mix(body, COOL, smoothstep(-0.1, -0.35, uv.y) * smoothstep(0.1, -0.2, uv.x) * fres);
	body = mix(body, ACC, smoothstep(-0.05, -0.3, uv.y) * fres * 0.8);
	// a deep core in the big lobe, low right of its centre: the cool colour deepened
	vec2 cs = (uv - lobe(0, t) - vec2(0.08, -0.07)) * vec2(1.0, 1.4);
	vec3 deep = mix(COOL, ACC, 0.25);
	body = mix(body, deep * deep * deep * 0.33, exp(-dot(cs, cs) * 30.0 / (uP[1] * uP[1])) * 0.85);
	body *= 0.85 + 0.25 * n.z;
	body += vec3(1.0) * pow(max(dot(reflect(vec3(0, 0, -1), n), normalize(vec3(-0.4, 0.7, 0.6))), 0.0), 24.0) * 0.5;
	body += vec3(1.0) * smoothstep(0.7, 1.0, fres) * 0.25;                      // the white edge
	// a soft shadow under them on the ground
	float sh = smoothstep(0.15, 0.45, field(uv + vec2(0.02, 0.07), t)) * (1.0 - inside);
	vec3 col = mix(bg * (1.0 - sh * 0.12), body, inside);
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default blob;
