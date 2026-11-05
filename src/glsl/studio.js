/**
 * @module @logomarks/shaders/glsl/studio
 *
 * GLSL for a photo studio for glass to reflect, `glassRoom(r)`: a dark
 * room, a tall softbox at the left and a strip light at the right, lit in
 * the glint.
 */

/** The studio helper. */
export const STUDIO_GLSL = /* glsl */ `// a photo studio, for glass to reflect: a dark room, a tall softbox at the left, a strip light at the right.
// r is the reflected ray (z toward the viewer). Its lights are the glint (white by default)
vec3 glassRoom(vec3 r) {
	vec2 p = r.xy / (1.0 + max(r.z, -0.8));
	vec3 L = lift(uC4, 0.7);
	vec3 c = mix(vec3(0.015), vec3(0.05), smoothstep(-0.8, 0.8, p.y));
	c += L * 1.7 * (1.0 - smoothstep(-0.04, 0.04, max(abs(p.x + 0.52) - 0.17, abs(p.y - 0.12) - 0.48)));
	c += L * vec3(1.0, 0.97, 0.94) * 1.0 * (1.0 - smoothstep(-0.02, 0.02, max(abs(p.x - 0.64) - 0.035, abs(p.y) - 0.62)));
	return c;
}
`;
