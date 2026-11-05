/**
 * @module @logomarks/shaders/glitter
 *
 * Glitter galaxy: a marbled nebula with dense glitter and flaring stars, cutting between the palette's three colours like a video.
 *
 * Colours (c1–c3 are `colors`): c1, c2, c3 one cut each (each a dark, mid and light of that colour), glint the stars.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Glitter galaxy. */
export const glitter = define({
	name: 'glitter',
	title: 'Glitter galaxy',
	description: 'A marbled nebula with dense glitter and flaring stars, cutting between the palette\'s three colours like a video.',
	scale: 0.85,
	ground: '#060608',
	look: { colors: ['#8580eb', '#db2e8c', '#d16be0'], glint: '#fff2e6' },
	params: [
		{ key: 'glitter', label: 'Glitter', min: 0, max: 0.35, step: 0.01, default: 0.1 },
		{ key: 'sparkles', label: 'Sparkles', min: 0, max: 0.5, step: 0.01, default: 0.2 },
		{ key: 'stars', label: 'Stars', min: 0, max: 8, step: 1, default: 4 },
		{ key: 'cuts', label: 'Cuts a second', min: 0, max: 5, step: 0.05, default: 1.6 },
		{ key: 'scale', label: 'Scale', min: 0.5, max: 4, step: 0.05, default: 1.5 },
	],
	fragment: `${HEAD}
// a cut's colours: its colour as the mid, deepened for the dark, paled for the light
vec3 pal(int k, float x) {
	vec3 m = lift(k == 0 ? uC1 : k == 1 ? uC2 : uC3, 0.4);
	vec3 d = m * m * 0.4 + m * 0.3, l = mix(m, vec3(1.0), 0.8);
	return x < 0.5 ? mix(d, m, x * 2.0) : mix(m, l, x * 2.0 - 1.0);
}
void main() {
	vec2 uv = sceneUv();
	// a hard cut every so often (uP[3] a second): the next colour, and another view of the galaxy
	float cut = floor(uTime * uP[3]);
	int k = int(mod(cut, 3.0));
	vec2 off = vec2(hash(vec2(cut, 1.0)), hash(vec2(cut, 2.0))) * 9.0;
	vec2 p = rot(hash(vec2(cut, 5.0)) * 6.28) * uv * uP[4] + off + uTime * 0.015;
	// marble: the nebula's bands, warped
	float neb = fbm(p * 1.2 + 1.6 * vec2(fbm(p * 2.1), fbm(p * 2.1 + 3.7)));
	float band = smoothstep(0.38, 0.82, neb);
	vec3 col = pal(k, clamp(neb * 0.9 + band * 0.35, 0.0, 1.0));
	// glitter: fine specks everywhere, larger ones fewer, brighter where the nebula is
	vec2 g1 = floor(gl_FragCoord.xy / 2.0 + off * 50.0);
	float s1 = step(1.0 - uP[0], hash(g1)) * hash(g1 + 7.0);
	vec2 cell = gl_FragCoord.xy / 7.0 + off * 20.0;
	vec2 cid = floor(cell), cf = fract(cell) - 0.5 - (vec2(hash(cid), hash(cid + 3.0)) - 0.5) * 0.6;
	float s2 = step(1.0 - uP[1], hash(cid + 11.0)) * smoothstep(0.32, 0.0, length(cf));
	vec3 light = pal(k, 1.0);
	col += light * (s1 * 0.75 + s2 * 0.9) * (0.5 + 0.8 * band);
	// a few stars, flaring
	vec3 S = lift(uC4, 0.7);
	int N = int(uP[2] + 0.5);
	for (int i = 0; i < 8; i++) {
		if (i >= N) break;
		vec2 sp = vec2(hash(vec2(cut, float(i) + 10.0)), hash(vec2(cut, float(i) + 20.0))) * vec2(1.4, 1.0) - vec2(0.7, 0.5);
		vec2 d = uv - sp;
		float r = length(d);
		col += S * (exp(-r * 140.0) * 1.4 + exp(-r * 30.0) * 0.25 + exp(-abs(d.x) * 400.0) * exp(-abs(d.y) * 40.0) * 0.3 + exp(-abs(d.y) * 400.0) * exp(-abs(d.x) * 40.0) * 0.3);
	}
	// printed: a fine, uneven texture over it all
	col *= 0.86 + 0.18 * hash(floor(gl_FragCoord.xy / 1.5) + cut);
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default glitter;
