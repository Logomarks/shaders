/**
 * @module @arraypress/shaders/chrome
 *
 * Chrome liquid: metal blobs merging in a studio; the pointer is one more, and sends ripples through them.
 *
 * Colours (c1–c3 are `colors`): c1 the studio's light above, c2 the metal's tint, c3 the floor it reflects, glint the softbox strips.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Chrome liquid. */
export const chrome = define({
	name: 'chrome',
	title: 'Chrome liquid',
	description: 'Metal blobs merging in a studio; the pointer is one more, and sends ripples through them.',
	scale: 0.5,
	ground: '#060608',
	look: { colors: ['#bfc7d6', '#ebf0ff', '#1f1a17'], glint: '#ffffff' },
	params: [
		{ key: 'count', label: 'Blobs', min: 1, max: 8, step: 1, default: 5 },
		{ key: 'size', label: 'Size', min: 0.5, max: 1.8, step: 0.01, default: 1 },
		{ key: 'wander', label: 'Wander', min: 0, max: 1.8, step: 0.02, default: 1 },
		{ key: 'ripple', label: 'Ripple', min: 0, max: 0.15, step: 0.005, default: 0.06 },
	],
	fragment: `${HEAD}
float field(vec2 p, float t) {
	float s = 0.0;
	int N = int(uP[0] + 0.5);
	for (int i = 0; i < 8; i++) {
		if (i >= N) break;
		float fi = float(i);
		vec2 c = vec2(sin(t * (0.31 + 0.07 * fi) + fi * 2.1), cos(t * (0.27 + 0.05 * fi) + fi * 1.3)) * vec2(0.28, 0.3) * uP[2];
		float r = (0.11 + 0.03 * sin(fi * 3.7)) * uP[1];
		s += r * r / max(dot(p - c, p - c), 1e-4);
	}
	vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
	s += 0.012 / max(dot(p - m, p - m), 1e-4);
	// ripples spreading from the pointer through the metal
	float d = length(p - m);
	s += uP[3] * sin(d * 46.0 - t * 9.0) * exp(-d * 5.0);
	return s;
}
vec3 env(vec3 r) {
	// a studio: a bright softbox strip, a horizon line, a dark floor
	float y = r.y;
	vec3 S = lift(uC4, 0.8);
	vec3 c = mix(vec3(0.03, 0.03, 0.035), lift(uC1, 0.55), smoothstep(-0.05, 0.6, y));
	c += S * smoothstep(0.06, 0.0, abs(y - 0.32)) * 1.4;
	c += mix(S, vivid(uC2, 0.9), 0.6) * smoothstep(0.03, 0.0, abs(r.x - 0.45)) * smoothstep(0.0, 0.4, y) * 0.8;
	c = mix(c, lower(uC3, 0.11) * (0.6 + 0.4 * sin(r.x * 8.0)), smoothstep(0.02, -0.08, y));
	return c;
}
void main() {
	vec2 uv = sceneUv();
	float t = uTime;
	float h = field(uv, t);
	vec2 e = vec2(0.002, 0.0);
	vec2 g = vec2(field(uv + e.xy, t) - field(uv - e.xy, t), field(uv + e.yx, t) - field(uv - e.yx, t)) / (2.0 * e.x);
	vec3 col = mix(vec3(0.02), vec3(0.07, 0.07, 0.08), uv.y + 0.5);
	float inside = smoothstep(0.97, 1.03, h);
	vec3 n = normalize(vec3(-g * 0.06, 1.0));
	vec3 rd = vec3(0.0, 0.0, -1.0);
	vec3 r = reflect(rd, n);
	float fres = pow(1.0 - n.z, 2.0);
	vec3 metal = env(r) * mix(mix(vec3(1.0), vivid(uC2, 0.9), 0.6), vec3(1.0), fres);
	metal *= 0.75 + 0.25 * smoothstep(1.0, 2.5, h);           // darker at the thin edges
	col = mix(col, metal, inside);
	// a soft contact shadow and glow round the metal
	col += vec3(0.08) * smoothstep(0.6, 1.0, h) * (1.0 - inside);
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default chrome;
