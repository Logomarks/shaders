/**
 * @module @logomarks/shaders/oil-bubbles
 *
 * Oil bubbles: clear glassy bubbles of many sizes on marbled ink, bending the swirls through them; they drift, touch, merge and part.
 *
 * Colours (c1–c3 are `colors`): c1 the first ink, c2 the second ink, c3 the ground (paled for a light ground, deepened for a dark one), glint the light the bubbles reflect (their rims and windows).
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Oil bubbles. */
export const oilBubbles = define({
	name: 'oil-bubbles',
	title: 'Oil bubbles',
	description: 'Clear glassy bubbles of many sizes on marbled ink, bending the swirls through them; they drift, touch, merge and part.',
	scale: 0.6,
	ground: '#efebe6',
	look: { colors: ['#1f86c7', '#e2481f', '#f3eee8'], glint: '#ffffff', grain: 0.3 },
	params: [
		{ key: 'count', label: 'Bubbles', min: 2, max: 24, step: 1, default: 14 },
		{ key: 'size', label: 'Size range', min: 0.4, max: 2, step: 0.01, default: 1 },
		{ key: 'flow', label: 'Flow', min: 0, max: 3, step: 0.05, default: 1 },
		{ key: 'scale', label: 'Marbling scale', min: 0.4, max: 3, step: 0.02, default: 1.2 },
		{ key: 'ground', label: 'Ground (light → dark)', min: 0, max: 1, step: 0.01, default: 0 },
		{ key: 'refraction', label: 'Refraction', min: 0, max: 1.5, step: 0.01, default: 0.7 },
	],
	fragment: `${HEAD}
// the marbled ink: the colours laid in bands, then pulled twice through a slow smooth flow, so they curl into long
// swirls (like oil paint on water) with fine streaks running along them
vec3 marbling(vec2 p, float t, vec3 G, vec3 I1, vec3 I2) {
	vec2 q = p * uP[3];
	vec2 w = vec2(soft(q * 0.7 + vec2(0.0, t)), soft(q * 0.7 + vec2(5.2, 1.3 - t)));
	vec2 q2 = q + 2.4 * w;
	vec2 w2 = vec2(soft(q2 * 1.2 + vec2(1.7, 9.2) + t * 0.7), soft(q2 * 1.2 + vec2(8.3, 2.8) - t * 0.5));
	vec2 q3 = q + 2.3 * w2;
	// big masses of each ink with bare ground between, their edges pulled into swirls by the flow
	vec2 q4 = q3 + 0.35 * vec2(noise(q3 * 2.6 + t), noise(q3 * 2.6 + vec2(4.1, 7.7) - t));   // fine curls at the edges
	float X = 0.5 + 1.5 * (soft(q4 * 0.42 + vec2(2.0, 4.0)) - soft(q * 0.5 + vec2(7.3, 1.9) - t * 0.3));   // balanced: as much of each ink
	float a1 = smoothstep(0.48, 0.33, X), a2 = smoothstep(0.54, 0.69, X);
	// inside a mass, streaks: the masses' own outlines repeated inward, so they follow every swirl, as marbling's do.
	// Only where the ink is being pulled (the field is steep), so flat middles stay smooth instead of ringed, and faded
	// out before they are finer than the pixels
	float fw = fwidth(X);
	float pull = smoothstep(0.2, 1.4, fw * uRes.y * uZoom);
	float wisp = smoothstep(0.3, 0.7, noise(q3 * 1.7 + vec2(3.3, 0.0)));                // broken into wisps, not rings
	float lines = sin(X * 62.0 + w2.x * 3.0) * pull * wisp * smoothstep(0.12, 0.05, fw * 62.0 / 6.2832);
	float vein = pow(0.5 + 0.5 * sin(X * 150.0 + w.y * 4.0), 8.0) * pull * smoothstep(0.12, 0.05, fw * 150.0 / 6.2832);
	float dens = mix(0.66, 1.0, smoothstep(-0.7, 0.9, lines)) * (1.0 - 0.3 * vein);
	float deep = max(smoothstep(0.3, 0.12, X), smoothstep(0.72, 0.9, X)) * (0.6 + 0.4 * lines);
	vec3 c1 = mix(I1, I1 * I1 * 0.8, deep * 0.6), c2 = mix(I2, I2 * I2 * 0.85, deep * 0.6);
	vec3 col = mix(G, c1, a1 * dens);
	return mix(col, c2, a2 * dens);
}
// the room the bubbles reflect: over a light ground a bright room, its floor darker; over a dark one a black studio. In
// both, a big window up at the left and a strip light at the right (in the glint), and round the horizon the ink
// around the bubble and the light off the water, which is what lights the rims
vec3 room(vec3 r, vec3 G, vec3 L, vec3 around, float dark) {
	vec2 p = r.xy / (1.0 + max(r.z, -0.85));
	vec3 c = mix(mix(G * 0.85, mix(G, vec3(1.0), 0.4), smoothstep(-0.9, 0.7, p.y)), vec3(0.015) + L * 0.25 * smoothstep(-0.3, 0.9, p.y - 0.3 * p.x), dark);
	c = mix(c, mix(around * mix(0.55, 1.0, dark), L, mix(0.15, 0.35, dark)), smoothstep(-0.1, -0.6, r.z));
	c += L * mix(0.5, 0.8, dark) * smoothstep(-0.93, -0.99, r.z);                   // the light skimming the water
	vec2 sb = (p - vec2(-0.5, 0.45)) / vec2(0.7, 0.5);
	c += L * mix(0.6, 2.2, dark) * exp(-dot(sb, sb) * 1.5);                         // a big soft box overhead
	c += L * 1.6 * (1.0 - smoothstep(-0.05, 0.05, max(abs(p.x + 0.45) - 0.2, abs(p.y - 0.35) - 0.16)));
	c += L * 0.9 * (1.0 - smoothstep(-0.03, 0.03, max(abs(p.x - 0.62) - 0.04, abs(p.y + 0.05) - 0.4)));
	return c;
}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.12 * uP[2];
	float dark = uP[4];
	vec3 G = mix(atLuma(mix(vec3(luma(uC3)), uC3, 0.35), 0.88), lower(uC3, 0.025), dark);
	vec3 I1 = mix(lower(lift(uC1, 0.12), 0.5), lift(uC1, 0.3), dark);
	vec3 I2 = mix(lower(lift(uC2, 0.12), 0.5), lift(uC2, 0.3), dark);
	vec3 L = lift(uC4, 0.75);
	// the bubbles: circles, smoothly united (log-sum-exp, kept stable round the nearest) so close ones neck and merge;
	// where two overlap the nearer edge wins and a wall forms between them
	int N = int(uP[0] + 0.5);
	float k = 0.012;
	float m = 1e3, s = 0.0, d2 = 1e3, Rw = 0.0;
	vec2 gw = vec2(0.0);
	for (int i = 0; i < 24; i++) {
		if (i >= N) break;
		float fi = float(i);
		float h1 = hash(vec2(fi, 1.37)), h2 = hash(vec2(fi, 7.11)), h3 = hash(vec2(fi, 3.93));
		float R = mix(0.025, 0.32 * uP[1], pow(h1, 1.6));
		vec2 c = vec2(fract(0.31 + fi * 0.7548777) * 2.0 - 1.0, fract(0.62 + fi * 0.5698403) * 1.3 - 0.65);   // spread evenly (the plastic-number sequence)
		c += (0.06 + 0.1 * h3) * vec2(sin(t * (0.5 + h2) + fi * 2.1), cos(t * (0.4 + h1 * 0.8) + fi * 1.3)) / (0.6 + 2.0 * R);
		vec2 v = uv - c;
		float lv = length(v);
		float di = lv - R;
		vec2 gi = v / max(lv, 1e-4);
		if (di < m) {
			float e = exp((di - m) / k);
			s = s * e + 1.0; gw = gw * e + gi; Rw = Rw * e + R;
			d2 = m; m = di;
		} else {
			float e = exp((m - di) / k);
			s += e; gw += gi * e; Rw += R * e;
			d2 = min(d2, di);
		}
	}
	float d = m - k * log(s);
	vec2 gr = gw / s;
	float Re = Rw / s;
	float px = 1.5 / uRes.y / uZoom;
	float cov = smoothstep(px, -px, d);
	// tiny satellite bubbles: one in some cells, most often round the big ones' rims
	vec2 tp = uv * 22.0 + vec2(t * 0.6, -t * 0.4);
	vec2 cell = floor(tp), f = fract(tp);
	float ht = hash(cell + 17.0);
	float near = exp(-abs(d) * 25.0);
	float rt = (0.1 + 0.28 * hash(cell + 3.1)) * (d < 0.0 ? 0.45 : 1.0);
	vec2 ct = 0.5 + (0.45 - rt) * (vec2(hash(cell + 5.3), hash(cell + 9.7)) * 2.0 - 1.0);
	float dt = (length(f - ct) - rt) / 22.0;
	float hasT = step(ht, d < 0.0 ? 0.05 : 0.03 + 0.7 * near);
	float covT = hasT * smoothstep(px, -px, dt);
	// the surface we look through: the tiny bubble's dome where there is one, else the big ones'
	float sb = clamp(1.0 + d / Re, 0.0, 1.0);
	vec2 nxy = normalize(gr + 1e-5) * sb;
	float Rs = Re;
	if (covT > 0.0) {
		vec2 vt = (f - ct) / rt;
		nxy = mix(nxy, vt / max(1.0, length(vt)), covT);
		Rs = mix(Re, rt / 22.0, covT);
	}
	float c = max(cov, covT);
	float sl = clamp(length(nxy), 0.0, 1.0);
	vec3 n = vec3(nxy, sqrt(max(1.0 - sl * sl, 0.0)));
	// refraction: the ink seen through the lens is magnified and bent, most near the rim
	vec2 sp = uv - nxy * Rs * uP[5] * (0.45 + 0.9 * sl * sl) * c;
	vec3 back = marbling(uv, t, G, I1, I2);
	vec3 thru = marbling(sp, t, G, I1, I2);
	// the reflection of the room, by Fresnel: faint face-on, the whole room at the rim
	vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
	float fres = mix(0.03, 0.06, dark) + 0.95 * pow(1.0 - n.z, 3.0);
	vec3 env = room(r, G, L, back, dark);
	vec3 inside = thru * mix(1.03, 1.0, dark);
	inside *= 1.0 - mix(0.3, 0.25, dark) * smoothstep(0.88, 0.96, sl) * smoothstep(0.995, 0.975, sl);   // the dark lip just inside the rim
	vec3 bub = mix(inside, env, fres);
	// the wall where two bubbles meet
	float wall = cov * smoothstep(0.0, -0.004, d2) * exp(-abs(d2 - m) * 600.0);
	bub = mix(bub, mix(G * 0.7, L, 0.5 + 0.5 * dark), wall * 0.6);
	vec3 col = mix(back, bub, c);
	// a soft shadow below each bubble on a light ground (and a glow on a dark one)
	col *= 1.0 - (1.0 - dark) * 0.08 * (1.0 - c) * exp(-max(d, 0.0) * 30.0);
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default oilBubbles;
