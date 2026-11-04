/**
 * @module @arraypress/shaders/strands
 *
 * Glass strands: ribbons of black glass, sharp highlights sliding along them and splitting into colour at the hardest glints.
 *
 * Colours (c1–c3 are `colors`): c1–c3 the out-of-focus spectrum in the corners (looped), glint the warm glow in the third corner and the room.
 */

import { HEAD } from '../head.js';
import { define } from '../define.js';

/** Glass strands. */
export const strands = define({
	name: 'strands',
	title: 'Glass strands',
	description: 'Ribbons of black glass, sharp highlights sliding along them and splitting into colour at the hardest glints.',
	scale: 0.6,
	ground: '#060608',
	look: { colors: ['#ff4242', '#403dff', '#40ff3d'], glint: '#ff994d' },
	params: [
		{ key: 'count', label: 'Count', min: 2, max: 12, step: 1, default: 7 },
		{ key: 'width', label: 'Width', min: 0.4, max: 2.5, step: 0.02, default: 1 },
		{ key: 'spread', label: 'Spread', min: 0.01, max: 0.12, step: 0.002, default: 0.05 },
		{ key: 'bend', label: 'Bend', min: 0, max: 2, step: 0.02, default: 1 },
	],
	fragment: `${HEAD}
void main() {
	vec2 uv = sceneUv();
	float t = uTime * 0.1;
	vec3 A = lift(uC1, 0.3), B = lift(uC2, 0.3), C = lift(uC3, 0.3), G = uC4;
	vec3 col = vec3(0.008, 0.006, 0.005);
	col += G * 0.05 * exp(-dot(uv - vec2(-0.1, -0.2), uv - vec2(-0.1, -0.2)) * 3.0);   // a dim warm room behind
	// the bundle's spine: in at the top, sweeping down and right, flexing slowly
	float spine = 0.05 + uP[3] * (0.32 * uv.y * uv.y * sign(uv.y) - 0.42 * uv.y) + 0.05 * sin(uv.y * 2.4 + t * 2.0);
	int N = int(uP[0] + 0.5);
	float mid = float(N - 1) * 0.5;
	// back to front: each ribbon hides what's behind it
	for (int i = 0; i < 12; i++) {
		if (i >= N) break;
		float fi = float(i);
		float w = (0.085 + 0.06 * hash(vec2(fi, 7.0))) * uP[1];                         // its width
		float x0 = spine + (fi - mid) * uP[2] + 0.015 * sin(uv.y * 3.0 + t * (1.2 + 0.2 * fi) + fi);
		float u = (uv.x - x0) / w;                                                       // 0 … 1 across it
		if (u < 0.0 || u > 1.0) continue;
		// across the ribbon the surface turns: a curved strip of glass
		float nx = u * 2.0 - 1.0;
		vec3 n = normalize(vec3(nx * 1.4, 0.15 * sin(uv.y * 5.0 + fi), 1.0));
		// the studio light, a long softbox, reflected: a sharp band where the angle is right, sliding as it flexes
		float aim = 0.35 * sin(uv.y * 2.2 - t * 3.0 + fi * 1.7);
		float band = n.x - aim;
		float sp = 0.012;                                                                // dispersion at the hardest glint
		vec3 spec = vec3(exp(-pow((band + sp) / 0.022, 2.0)), exp(-pow(band / 0.02, 2.0)), exp(-pow((band - sp) / 0.024, 2.0)));
		spec *= 1.4;
		spec += vec3(0.62, 0.6, 0.58) * exp(-pow((band - 0.4) / 0.2, 2.0)) * 0.42;       // a broad silver reflection
		spec += vec3(0.3, 0.27, 0.24) * exp(-pow((band + 0.55) / 0.25, 2.0)) * 0.3;      // and the room, warm, on the other side
		// the edges: glass seen edge-on goes bright (Fresnel), as a hair-fine line
		float edge = exp(-u / 0.02) + exp(-(1.0 - u) / 0.015);
		float fres = pow(1.0 - n.z, 3.0);
		// the body: black glass with a little depth, darker in the middle
		vec3 body = vec3(0.012, 0.01, 0.01) + vec3(0.06, 0.05, 0.045) * fres;
		vec3 c = body + spec * (1.1 + 0.4 * hash(vec2(fi, 1.0))) + vec3(0.85, 0.85, 0.9) * edge * 0.7;
		// light fades along the strand, out of the top and bottom
		c *= smoothstep(-0.65, -0.1, uv.y + 0.2 * sin(fi)) * 0.8 + 0.2;
		col = c;
	}
	// out-of-focus colour in the corners, where the glass catches the light: the palette looped, one way and the other
	vec2 a = uv - vec2(0.38, 0.5), b = uv - vec2(-0.36, -0.45), c2 = uv - vec2(0.3, -0.55);
	float x = uv.x * 1.6 + uv.y * 0.6 + t * 0.4;
	col += loop3(A, B, C, x) * 0.2 * exp(-dot(a, a) * 22.0) + loop3(B, A, C, x) * 0.22 * exp(-dot(b, b) * 16.0) + G * 0.125 * exp(-dot(c2, c2) * 18.0);
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`,
});

export default strands;
