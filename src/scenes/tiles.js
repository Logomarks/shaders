/**
 * @module @arraypress/shaders/tiles
 *
 * Glossy tiles: ray-marched rounded tiles of glossy metal: lit bevels, black gaps, softboxes drifting over them.
 *
 * Colours (c1–c3 are `colors`): c1 the metal's tint, c2 the ceiling's cast, c3 the lit bevels, glint the softboxes.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Glossy tiles. */
export const tiles = define({
	name: 'tiles',
	title: 'Glossy tiles',
	description: 'Ray-marched rounded tiles of glossy metal: lit bevels, black gaps, softboxes drifting over them.',
	scale: 0.55,
	ground: '#060608',
	look: { colors: ['#1438ff', '#4066ff', '#99bfff'], glint: '#bfd9ff', grain: 0.35 },
	params: [
		{ key: 'size', label: 'Tile size', min: 0.5, max: 1.6, step: 0.01, default: 1 },
		{ key: 'gap', label: 'Gap', min: 0.06, max: 0.6, step: 0.01, default: 0.22 },
		{ key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.42 },
		{ key: 'bevel', label: 'Bevel', min: 0.01, max: 0.15, step: 0.005, default: 0.05 },
		{ key: 'height', label: 'Camera height', min: 1.8, max: 5, step: 0.05, default: 3 },
		{ key: 'turn', label: 'Turn', min: 0, max: 45, step: 1, default: 45 },
	],
	fragment: `${HEAD}
float sdRect(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
// a rounded tile, extruded with a soft bevel
float tile(vec3 p) {
	float d2 = sdRect(p.xz, vec2(uP[0]), uP[2] * uP[0]);
	vec2 w = vec2(d2, abs(p.y) - 0.18);
	return min(max(w.x, w.y), 0.0) + length(max(w + uP[3], 0.0)) - uP[3];
}
float map(vec3 p) {
	p.xz = rot(radians(uP[5])) * p.xz;  // the grid turned (45°: the gaps make an X)
	float cell = 2.0 * uP[0] + uP[1], hc = 0.5 * cell;
	vec2 id = floor((p.xz + hc) / cell);
	p.xz = mod(p.xz + hc, cell) - hc;
	p.y += 0.04 * sin(id.x * 1.7 + id.y * 2.3);   // not quite flat, as real tiles aren't
	return tile(p);
}
// (sampled over a few pixels' width: smooth normals, so thin highlights don't crawl)
vec3 normalAt(vec3 p) { vec2 e = vec2(0.006, 0.0); return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx))); }
// the studio around them: dark, with long softboxes (the light the metal shows) and a cast from the ceiling
vec3 env(vec3 r, float t) {
	vec3 M = vivid(uC1, 0.9);
	vec3 c = M * 0.03 + M * 0.25 * max(r.y, 0.0) * 0.6;
	vec2 a = vec2(atan(r.x, r.z), r.y);
	vec3 S = vivid(uC4, 0.9);
	// three softboxes overhead, drifting slowly across
	for (int i = 0; i < 3; i++) {
		float fi = float(i);
		float x = a.x - (-0.9 + fi * 0.9 + 0.35 * sin(t * 0.15 + fi * 2.0));
		float box = smoothstep(0.13, 0.03, abs(x)) * smoothstep(0.15, 0.4, a.y) * smoothstep(0.95, 0.75, a.y);
		c += S * box * (1.6 - fi * 0.35);
	}
	c += vivid(uC2, 0.9) * pow(max(r.y, 0.0), 6.0) * 0.6;     // the bright ceiling
	return c;
}
vec2 march(vec3 ro, vec3 rd, float maxd) {
	float d = 0.0;
	for (int i = 0; i < 64; i++) {
		float h = map(ro + rd * d);
		if (h < 0.0008) return vec2(d, 1.0);
		d += h * 0.95;
		if (d > maxd) break;
	}
	return vec2(d, 0.0);
}
// the metal's colour for a hit: tinted reflections of the studio, sharp at the bevels
vec3 shade(vec3 p, vec3 rd, vec3 n, float t, float bounce) {
	vec3 r = reflect(rd, n);
	float fres = 0.08 + 0.92 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
	vec3 tint = vivid(uC1, 0.9);
	vec3 e = env(r, t);
	vec3 c = tint * 0.09 + e * mix(tint, mix(vivid(uC4, 0.9), vec3(1.0), 0.4), fres) * (0.55 + 0.45 * fres);
	float bevel = smoothstep(0.97, 0.7, n.y) * smoothstep(0.05, 0.4, n.y);
	c += vivid(uC3, 0.9) * bevel * (max(e.r, max(e.g, e.b)) * 1.6 + 0.08);
	return c;
}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.08;
	vec3 ro = vec3(0.35 * sin(t), uP[4], -1.7 + 0.25 * cos(t * 0.7));
	vec3 ta = vec3(0.1 * sin(t * 0.5), 0.0, 0.6);
	vec3 fw = normalize(ta - ro), ri = normalize(cross(vec3(0, 1, 0), fw)), up = cross(fw, ri);
	vec3 rd = normalize(fw * 1.6 + ri * uv.x + up * uv.y);
	float lt = uTime + (uMouse.x - 0.5) * 6.0;
	vec2 h = march(ro, rd, 14.0);
	vec3 col = vec3(0.0);
	if (h.y > 0.5) {
		vec3 p = ro + rd * h.x, n = normalAt(p);
		col = shade(p, rd, n, lt, 0.0);
		// one bounce: the neighbours' bevels and faces, seen in this one
		vec3 r = reflect(rd, n);
		vec2 h2 = march(p + n * 0.01, r, 5.0);
		if (h2.y > 0.5) {
			vec3 p2 = p + n * 0.01 + r * h2.x, n2 = normalAt(p2);
			float fres = 0.08 + 0.92 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
			col = mix(col, shade(p2, r, n2, lt, 1.0) * 0.8, 0.35 + 0.5 * fres);
		}
		// deeper into the distance, and black down in the gaps
		col *= mix(1.0, 0.3, smoothstep(3.0, 9.0, h.x)) * mix(0.05, 1.0, smoothstep(-0.2, 0.15, p.y));
	}
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default tiles;
