/**
 * @module @logomarks/shaders/glsl/uniforms
 *
 * The first lines of every scene's fragment shader: the GLSL version, the
 * precision, and the uniforms the runner sets (the buffer's size, the
 * time, the pointer, the look, the palette and the scene's own settings).
 */

/** The version, precision, uniforms and output every scene declares (WebGL 2, GLSL ES 3.00). */
export const UNIFORMS_GLSL = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
// the look: colour, framing and grain (src/runtime/uniforms.js sets them)
uniform float uHue, uSat, uExposure, uTintAmt, uZoom, uAngle, uGrain;
uniform vec3 uTint;
// the palette: three colours and a glint (a highlight)
uniform vec3 uC1, uC2, uC3, uC4;
// the scene's own shape settings, in the order its params list them
uniform float uP[6];
out vec4 o;
`;
