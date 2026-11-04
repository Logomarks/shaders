/**
 * @module @arraypress/shaders/head
 *
 * The GLSL every scene starts with: its uniforms (the buffer's size, the
 * time, the pointer, the look, the palette and the scene's own settings),
 * `sceneUv()` for where a pixel is with the look's zoom and angle,
 * `finish()` for the look's colour, a vignette and grain, the palette
 * helpers that bring any colour to the part it plays (`lift`, `lower`,
 * `vivid`, `hueTurn`, `loop3`), noise, and `glassRoom()`, a studio for
 * glass to reflect.
 */

/** The shared head of every scene's fragment shader (WebGL 2, GLSL ES 3.00). */
export const HEAD = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
// the look: colour, framing and grain (src/core.js sets them)
uniform float uHue, uSat, uExposure, uTintAmt, uZoom, uAngle, uGrain;
uniform vec3 uTint;
// the palette: three colours and a glint (a highlight)
uniform vec3 uC1, uC2, uC3, uC4;
// the scene's own shape settings, in the order its params list them
uniform float uP[6];
out vec4 o;
// palette colours brought to the part they play, whatever their shade, so any palette reads: lift() keeps a colour
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
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
// where this pixel is, centred, with the look's zoom and angle
vec2 sceneUv() { return rot(uAngle) * ((gl_FragCoord.xy - 0.5 * uRes) / uRes.y) / uZoom; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p = rot(0.6) * p * 2.02; a *= 0.5; } return s; }
// a photo studio, for glass to reflect: a dark room, a tall softbox at the left, a strip light at the right.
// r is the reflected ray (z toward the viewer). Its lights are the glint (white by default)
vec3 glassRoom(vec3 r) {
	vec2 p = r.xy / (1.0 + max(r.z, -0.8));
	vec3 L = lift(uC4, 0.7);
	vec3 c = mix(vec3(0.015), vec3(0.05), smoothstep(-0.8, 0.8, p.y));
	c += L * 1.7 * (1.0 - smoothstep(-0.04, 0.04, max(abs(p.x + 0.52) - 0.17, abs(p.y - 0.12) - 0.48)));
	c += L * vec3(1.0, 0.97, 0.94) * 1.0 * (1.0 - smoothstep(-0.02, 0.02, max(abs(p.x - 0.64) - 0.035, abs(p.y) - 0.62)));
	return c;
}
// film grain and a soft vignette, as a photo has
vec3 finish(vec3 c, vec2 fc) {
	vec2 uv = fc / uRes;
	c *= uExposure;
	// hue turned round the grey axis, then saturation, then a tint toward a colour (keeping the light and dark)
	float l = dot(c, vec3(0.299, 0.587, 0.114));
	vec3 k = vec3(0.57735);
	float ch = cos(uHue), sh = sin(uHue);
	c = c * ch + cross(k, c) * sh + k * dot(k, c) * (1.0 - ch);
	c = mix(vec3(l), c, uSat);
	c = mix(c, uTint * l * 1.8, uTintAmt);
	c *= mix(0.72, 1.0, smoothstep(1.15, 0.35, length(uv - 0.5) * 1.4));
	c += (hash(fc + fract(uTime) * 91.0) - 0.5) * 0.035 * uGrain;
	return pow(max(c, 0.0), vec3(1.0 / 1.04));
}
`;
