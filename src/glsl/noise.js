/**
 * @module @logomarks/shaders/glsl/noise
 *
 * GLSL noise: `hash` (a pseudo-random number per point), `noise` (smooth
 * value noise), `fbm` (five octaves of it) and `soft` (three octaves,
 * normalised to 0–1: big smooth forms rather than ripples).
 */

/** The noise helpers. */
export const NOISE_GLSL = /* glsl */ `float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p = rot(0.6) * p * 2.02; a *= 0.5; } return s; }
// a smoother noise (three octaves, 0–1): big forms, not ripples
float soft(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * noise(p); p = rot(0.6) * p * 2.02; a *= 0.5; } return s / 0.875; }
`;
