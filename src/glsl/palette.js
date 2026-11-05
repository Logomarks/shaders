/**
 * @module @logomarks/shaders/glsl/palette
 *
 * GLSL that brings a palette colour to the part it plays in a scene,
 * whatever its shade, so any palette reads in any scene: `luma`,
 * `atLuma`, `lift` (no darker than a lightness), `lower` (no lighter),
 * `vivid` (at least this bright in its strongest channel), `hueTurn` (a
 * companion colour) and `loop3` (three colours looped into a spectrum).
 */

/** The palette helpers. */
export const PALETTE_GLSL = /* glsl */ `// palette colours brought to the part they play, whatever their shade, so any palette reads: lift() keeps a colour
// no darker than a lightness, lower() no lighter, vivid() at least this bright in its strongest channel
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 atLuma(vec3 c, float l) {
	c = max(c, vec3(0.004));
	vec3 s = c * (l / luma(c));
	float m = max(s.r, max(s.g, s.b));
	if (m > 1.0) { s /= m; float k = luma(s); s = mix(s, vec3(1.0), (l - k) / max(1.0 - k, 1e-3)); }
	return s;
}
vec3 lift(vec3 c, float l) { return luma(c) < l ? atLuma(c, l) : c; }
vec3 lower(vec3 c, float l) { float k = luma(c); return k > l ? c * (l / k) : c; }
vec3 vivid(vec3 c, float m) { return c * max(1.0, m / max(max(c.r, max(c.g, c.b)), 1e-3)); }
// a colour's hue turned (radians) round the grey axis: a companion colour
vec3 hueTurn(vec3 c, float a) { vec3 k = vec3(0.57735); return max(c * cos(a) + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - cos(a)), 0.0); }
// three colours looped smoothly (x 0 … 1 goes a, b, c and back to a): a spectrum made from the palette. With the
// rainbow's own three (#ff4242, #403dff, #40ff3d) it is exactly the cosine rainbow
vec3 loop3(vec3 a, vec3 b, vec3 c, float x) {
	vec3 w = (1.0 + 2.0 * cos(6.2831853 * x - vec3(0.0, 2.0943951, 4.1887902))) / 3.0;
	return max(a * w.x + b * w.y + c * w.z, 0.0);
}
`;
