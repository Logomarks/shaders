/**
 * @module @arraypress/shaders/glsl/space
 *
 * GLSL for where a pixel is: `rot` (a 2D rotation) and `sceneUv()` (the
 * pixel's position, centred, height 1, with the look's zoom and angle).
 */

/** The rotation and scene-position helpers. */
export const SPACE_GLSL = /* glsl */ `mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
// where this pixel is, centred, with the look's zoom and angle
vec2 sceneUv() { return rot(uAngle) * ((gl_FragCoord.xy - 0.5 * uRes) / uRes.y) / uZoom; }
`;
