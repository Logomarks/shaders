/**
 * @module @logomarks/shaders/melting-hologram
 *
 * Melting hologram: an iridescent liquid flowing and folding over black, thin-film colour sliding across its melted folds, with now and then a glassy bubble drifting by.
 *
 * Colours (c1–c3 are `colors`): the three are looped into the thin film's spectrum (the defaults make the rainbow), glint the studio light the liquid reflects (its bright edges and the bubbles' rims).
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Melting hologram. */
export const meltingHologram = define({
	name: 'melting-hologram',
	title: 'Melting hologram',
	description: 'An iridescent liquid flowing and folding over black, thin-film colour sliding across its melted folds, with now and then a glassy bubble drifting by.',
	scale: 0.6,
	ground: '#000000',
	look: { colors: ['#ff6a1f', '#5a2bff', '#18d8ff'], glint: '#ffffff', grain: 0.3 },
	params: [
		{ key: 'scale', label: 'Fold scale', min: 0.4, max: 2.5, step: 0.02, default: 1 },
		{ key: 'flow', label: 'Flow', min: 0, max: 3, step: 0.05, default: 1 },
		{ key: 'iridescence', label: 'Iridescence', min: 0.2, max: 2.5, step: 0.02, default: 1 },
		{ key: 'sharpness', label: 'Edge sharpness', min: 0, max: 1, step: 0.01, default: 0.7 },
		{ key: 'bubbles', label: 'Bubbles', min: 0, max: 6, step: 1, default: 3 },
	],
	fragment: `${HEAD}
// the liquid's height: a smooth flowing field (sine flow, no noise grain), cut at a level so it pools in melted
// bodies with black between; steep at its edges, with soft folds across its top
float height(vec2 p, float t) {
	vec2 q = p * uP[0];
	for (int i = 0; i < 4; i++) {
		float fi = float(i);
		q += (0.55 / (1.0 + 0.6 * fi)) * vec2(sin(q.y * (1.1 + 0.35 * fi) + t * (0.9 + 0.2 * fi) + fi * 1.9), sin(q.x * (1.0 + 0.3 * fi) - t * (0.7 + 0.25 * fi) + fi * 2.7));
	}
	float m = soft(q * 1.1 + vec2(1.3, 4.1));
	// melted bodies where the field is high, steep at their edges, with smooth folds and runs over their tops
	float w = mix(0.1, 0.006, uP[3]);
	float body = smoothstep(0.45, 0.45 + w, m);
	float folds = 0.5 + 0.5 * sin(q.x * 1.9 + q.y * 1.2 + m * 4.0);
	float comb = sin(m * 70.0 + q.x * 2.0) * smoothstep(0.5, 0.7, m);                // fine runs combed along the flow
	return body * (0.35 + 0.35 * folds + 0.3 * smoothstep(0.45, 0.62, m) + 0.012 * comb);
}
// the studio the liquid reflects: black, with a big soft light up at the left, a tall strip at the right and a
// low one below, and light along the horizon (what lights the edges as they turn away). Folds sweep the reflection
// across lights and black, so the colour comes in bands with black between
float studio(vec3 r) {
	vec2 p = r.xy / (1.0 + max(r.z, -0.85));
	vec2 a = (p - vec2(-0.35, 0.35)) / vec2(0.5, 0.35), b = (p - vec2(0.55, 0.0)) / vec2(0.12, 0.7), c = (p - vec2(0.0, -0.6)) / vec2(0.8, 0.1);
	return 0.01 + 1.6 * exp(-dot(a, a)) + 1.2 * exp(-dot(b, b)) + 0.8 * exp(-dot(c, c)) + 1.3 * smoothstep(-0.3, -0.9, r.z);
}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.1 * uP[1];
	vec3 A = vivid(uC1, 0.95), B = vivid(uC2, 0.95), C = vivid(uC3, 0.95);
	vec3 L = lift(uC4, 0.8);
	float px = 1.5 / uRes.y / uZoom;
	// the bubbles: a few glass spheres rising slowly through the frame, one after another
	int N = int(uP[4] + 0.5);
	vec2 bn = vec2(0.0);
	float bc = 0.0, bR = 1.0;
	for (int i = 0; i < 6; i++) {
		if (i >= N) break;
		float fi = float(i);
		float h1 = hash(vec2(fi, 2.7)), h2 = hash(vec2(fi, 8.3));
		float R = 0.05 + 0.09 * h1;
		float y = mod(0.25 * h2 * 6.0 + uTime * 0.02 * (0.6 + h1) * (0.3 + uP[1]), 1.8) - 0.9;
		vec2 c = vec2((fract(fi * 0.618 + 0.2) * 2.0 - 1.0) * 0.85 + 0.06 * sin(uTime * 0.2 + fi * 2.0), y);
		vec2 v = (uv - c) / R;
		float l = length(v);
		float cv = smoothstep(1.0 + px / R, 1.0 - px / R, l);
		if (cv > bc) { bc = cv; bn = v / max(1.0, l); bR = R; }
	}
	float bz = sqrt(max(1.0 - dot(bn, bn), 0.0));
	// seen through a bubble, the liquid behind is bent (and turned over near its rim)
	vec2 sp = uv - bn * bR * 1.6 * bc;
	float e = 0.004;
	float h = height(sp, t);
	vec2 g = vec2(height(sp + vec2(e, 0.0), t) - h, height(sp + vec2(0.0, e), t) - h) / e;
	float sh = mix(0.25, 0.4, uP[3]);
	vec3 n = normalize(vec3(-g * sh, 1.0));
	vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
	// thin film: its colour set by the film's thickness (which follows the liquid's height, so it bands tightly where
	// the surface falls away) and the angle it is seen at; it slides as the liquid flows
	float k = studio(r);
	float phase = uP[2] * (h * 2.0 + r.x * 0.6 + r.y * 0.4 + 0.25 * sin(sp.x * 2.0 + sp.y * 1.3 + t * 2.0)) + t * 0.6;
	vec3 film = loop3(A, B, C, phase);
	vec3 col = film * k * 1.35 + L * max(k - 1.2, 0.0) * 0.4;                      // the brightest of it runs to white
	col += L * pow(1.0 - n.z, 14.0) * 0.6;                                            // the edges, white-hot where they turn away
	col *= smoothstep(0.0, 0.05, h);                                                 // black where there is no liquid
	// the bubble itself: a faint thin film over clear glass, the studio in its rim
	float bf = 0.1 + 0.9 * pow(1.0 - bz, 2.5);
	vec3 br = reflect(vec3(0.0, 0.0, -1.0), vec3(bn, bz));
	vec3 bubble = col * 0.85 + loop3(A, B, C, bz * 1.5 + uP[2] * 0.6 + t) * studio(br) * L * bf * 2.0;
	col = mix(col, bubble, bc);
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default meltingHologram;
