/**
 * @module @logomarks/shaders/spheres-shader
 *
 * The pastel spheres' shader, shared by `spheres` and `spheres2`: matte
 * spheres floating at different depths, each placed by `seed`.
 */

import { HEAD } from '../head.js';

/**
 * The spheres' fragment shader, its spheres placed by a seed.
 *
 * @param {number} seed Places the spheres (3 for `spheres`, 11 for `spheres2`).
 * @returns {string} The fragment shader.
 */
export const spheresShader = (seed) => /* glsl */ `${HEAD}
void main() {
	vec2 uv = sceneUv();
	float t = uTime;
	vec3 col = vec3(0.0);
	vec3 WARM = lift(uC1, 0.4), COOL = lift(uC2, 0.4), DEEP = lower(uC3, 0.08), KEY = lift(uC4, 0.6);
	vec3 Lk = normalize(vec3(-0.45, 0.55, 0.75));   // the soft key, up and to the left
	vec3 Lc = normalize(vec3(0.9, 0.15, 0.35));     // the cool light from the right
	vec3 Lw = normalize(vec3(-0.6, -0.65, 0.4));    // warm bounce from below left
	int N = int(uP[0] + 0.5);
	// far to near, so each one sits in front of those before it
	for (int i = 0; i < 24; i++) {
		if (i >= N) break;
		float fi = float(i), s = fi * 7.31 + ${seed.toFixed(1)};
		float z = 1.0 - fi / float(max(N - 1, 1));                  // 1 far … 0 near
		vec2 c = vec2(hash(vec2(s, 1.0)) * 1.9 - 0.95, hash(vec2(s, 2.0)) * 1.5 - 0.75);
		c += uP[4] * vec2(sin(t * (0.21 + 0.05 * fi) + s), cos(t * (0.17 + 0.04 * fi) + s * 1.3)) * (1.4 - z); // drifting
		float r = mix(uP[1], 0.12, z) * (0.75 + 0.5 * hash(vec2(s, 3.0)));
		// out of focus with distance from the focal depth: a softer edge and softer light
		float blur = 0.002 + pow(abs(z - uP[2]), 1.3) * uP[3];
		vec2 d = (uv - c) / r;
		float l = length(d);
		float a = smoothstep(1.0 + blur / r, 1.0 - blur / r, l);
		if (a <= 0.0) continue;
		vec3 n = vec3(d, sqrt(max(1.0 - min(l, 1.0) * min(l, 1.0), 0.0)));
		float k = pow(clamp(dot(n, Lk) * 0.5 + 0.5, 0.0, 1.0), 2.2);
		float b = pow(clamp(dot(n, Lc) * 0.5 + 0.5, 0.0, 1.0), 3.0);
		float w = pow(clamp(dot(n, Lw) * 0.5 + 0.5, 0.0, 1.0), 3.0);
		// each sphere leans warm or cool a little
		float lean = hash(vec2(s, 4.0));
		vec3 c3 = DEEP * 0.35 + KEY * k * 0.82 + COOL * b * (0.55 + 0.6 * lean) + WARM * w * (0.5 + 0.7 * (1.0 - lean));
		// a darker crescent away from the light; the edge picks up colour (light through a matte skin)
		c3 *= mix(0.3, 1.0, smoothstep(-0.9, 0.2, dot(n, Lk)));
		c3 += mix(WARM, COOL, lean) * pow(1.0 - n.z, 3.0) * 0.35;
		c3 *= mix(0.78, 1.0, 1.0 - z * 0.4);
		// soft spheres lose contrast, as defocused light does
		c3 = mix(c3, vec3(dot(c3, vec3(0.33))) * 0.9 + c3 * 0.1, clamp(blur * 2.5, 0.0, 0.25));
		col = mix(col, c3, a);
	}
	col += (hash(gl_FragCoord.xy * 0.9 + fract(uTime) * 47.0) - 0.5) * 0.07;   // more grain: a photo, not a render
	o = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`;
