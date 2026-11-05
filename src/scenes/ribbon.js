/**
 * @module @logomarks/shaders/ribbon
 *
 * Neon ribbon: a thick sheet of clear glass curving through black, its edges split into colour, throwing a wide field of light inside its curve.
 *
 * Colours (c1–c3 are `colors`): c1 the broad warm field (turned toward yellow at its core, toward red far out), c2 the thin band at the glass's edge, c3 the second band, glint the edge highlights.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Neon ribbon. */
export const ribbon = define({
	name: 'ribbon',
	title: 'Neon ribbon',
	description: 'A thick sheet of clear glass curving through black, its edges split into colour, throwing a wide field of light inside its curve.',
	scale: 0.6,
	ground: '#060608',
	look: { colors: ['#ff5a1f', '#5ff0ff', '#ff2bd6'], glint: '#ffffff' },
	params: [
		{ key: 'field', label: 'Field', min: 0.1, max: 0.8, step: 0.01, default: 0.42 },
		{ key: 'thickness', label: 'Thickness', min: 0.01, max: 0.08, step: 0.001, default: 0.035 },
		{ key: 'sheets', label: 'Sheets', min: 1, max: 3, step: 1, default: 2 },
		{ key: 'bend', label: 'Bend', min: 0.7, max: 1.25, step: 0.01, default: 1 },
		{ key: 'fringe', label: 'Fringe', min: 0, max: 3, step: 0.05, default: 1 },
	],
	fragment: `${HEAD}
vec2 bez(vec2 a, vec2 b, vec2 c, vec2 d, float s) { float r = 1.0 - s; return r * r * r * a + 3.0 * r * r * s * b + 3.0 * r * s * s * c + s * s * s * d; }
// the signed distance to each half of a curve (negative to the right of its travel: the inside of the hook) and how
// far along the whole curve its nearest point is (0 … 1): .xy for the first half, .zw the second; from 32 straight pieces
vec4 curve(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
	vec4 r = vec4(1e9, 0.0, 1e9, 0.0);
	vec2 sg = vec2(1.0);
	vec2 q0 = a;
	for (int i = 1; i <= 32; i++) {
		vec2 q1 = bez(a, b, c, d, float(i) / 32.0);
		vec2 e = q1 - q0, w = p - q0;
		float h = clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
		vec2 v = w - e * h;
		float dd = dot(v, v), al = (float(i - 1) + h) / 32.0, sd = e.x * w.y - e.y * w.x;
		if (i <= 16) { if (dd < r.x) { r.xy = vec2(dd, al); sg.x = sd; } }
		else if (dd < r.z) { r.zw = vec2(dd, al); sg.y = sd; }
		q0 = q1;
	}
	return vec4(sqrt(r.x) * sign(sg.x), r.y, sqrt(r.z) * sign(sg.y), r.w);
}
// a hair-fine line along an edge of the glass (x: the distance out from it), split into colour: red outside,
// blue inside
vec3 edgeLine(float x, float px) {
	float s = max(px * 0.8, 0.0012), o = 0.0022 * uP[4];
	return vec3(exp(-pow((x - o) / s, 2.0)), exp(-pow(x / s, 2.0)), exp(-pow((x + o) / s, 2.0)));
}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.12;
	vec3 G = lift(uC4, 0.75);
	vec3 W = vivid(uC1, 0.9), E1 = vivid(uC2, 0.9), E2 = vivid(uC3, 0.9);
	vec3 core = mix(vivid(hueTurn(W, 0.6), 1.0), vec3(1.0), 0.12), far = vivid(hueTurn(W, -0.3), 0.8);
	vec3 col = vec3(0.0);
	int N = int(uP[2] + 0.5);
	// back to front: the sheets behind show only their edges; the front one throws the light
	for (int k = 2; k >= 0; k--) {
		if (k >= N) continue;
		float fk = float(k);
		vec2 off = vec2(0.12, -0.05) * fk;
		// a hook: up from the lower left, over at the top right and down again, flexing slowly
		vec2 a = vec2(-0.62, -0.5) + off, d = vec2(0.62, -0.42) + off;
		vec2 b = mix(mix(a, d, 0.33), vec2(0.46 + 0.07 * sin(t * 1.3 + fk), 0.98 + 0.08 * cos(t * 1.1 + fk)), uP[3]);
		vec2 c = mix(mix(a, d, 0.67), vec2(-0.02 + 0.08 * sin(t * 0.9 + 2.0 + fk), -0.14 + 0.08 * sin(t * 1.2 + fk)), uP[3]);
		vec4 cv = curve(uv, a, b, c, d);
		bool first = abs(cv.x) < abs(cv.z);
		float sd = first ? cv.x : cv.z, al = first ? cv.y : cv.w;
		float px = fwidth(sd);
		float w = uP[1] * (1.0 + 0.25 * sin(al * 6.0 + t * 2.0 + fk) + 0.4 * exp(-pow((al - 0.5) / 0.07, 2.0)));   // the thickness: wider where it turns over
		float vis = k == 0 ? 1.0 : 0.5 / fk;
		float ends = smoothstep(0.0, 0.1, al) * smoothstep(1.0, 0.9, al);
		// the glass between its edges: almost clear, a faint dark grey, a soft sheen sliding along it
		float inG = smoothstep(w + px, w - px, abs(sd));
		vec3 body = vec3(0.012 + 0.08 * pow(abs(sd) / w, 5.0)) + G * 0.09 * exp(-pow((sd - 0.3 * w) / (0.35 * w), 2.0)) * (0.5 + 0.5 * sin(al * 9.0 - t * 3.0));
		col = mix(col, col * 0.7 + body * vis, inG);
		// the edges of its thickness, each doubled (the front and back of the glass)
		vec3 e = edgeLine(sd - w, px) + 0.8 * edgeLine(-sd - w, px) + 0.35 * (edgeLine(sd - w + 0.011, px) + edgeLine(-sd - w + 0.013, px));
		col += e * G * vis * ends * 1.4;
		if (k == 0) {
			// the light thrown through it, in bands parallel to the inner edge: sharp at the glass, soft far out. From
			// the rising half a broad warm field (white-hot at the glass, through c1 to a deeper red); from the falling
			// half a narrower band of the second colour
			float breathe = 1.0 + 0.1 * sin(t * 1.7);
			float x = -cv.x - w, u = x / (uP[0] * breathe * (1.0 + 0.15 * sin(cv.y * 6.0 - t)));
			float along = smoothstep(0.02, 0.2, cv.y) * mix(0.35, 1.0, smoothstep(0.5, 0.3, cv.y));
			vec3 warm = mix(mix(core, W, smoothstep(0.0, 0.35, u)), far, smoothstep(0.3, 0.8, u));
			float I = smoothstep(-px, px + 0.012, x - 0.03) * (1.0 - smoothstep(0.15, 1.0, u)) * 1.35;
			vec3 bands = E1 * exp(-pow((x - 0.008) / 0.006, 2.0)) * 1.3 + far * exp(-pow((x - 0.022) / 0.006, 2.0)) * 0.9;
			along *= smoothstep(px, -px - 0.02, cv.z + w);                                // not past the falling half
			col += (warm * I + bands * step(0.0, x)) * along;
			float x2 = -cv.z - w, u2 = (x2 - 0.055) / (uP[0] * 0.26 * breathe);
			float along2 = smoothstep(0.5, 0.62, cv.w) * smoothstep(0.98, 0.8, cv.w);
			vec3 band2 = mix(E2, mix(E2, E1, 0.6), smoothstep(0.4, 1.0, u2));
			float I2 = smoothstep(-px, px + 0.012, x2 - 0.06) * pow(max(1.0 - u2, 0.0), 1.2) * 1.3;
			col += (band2 * I2 + E1 * exp(-pow((x2 - 0.006) / 0.005, 2.0)) * step(0.0, x2)) * along2;
		}
	}
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default ribbon;
