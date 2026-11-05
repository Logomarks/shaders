/**
 * @module @logomarks/shaders/glsl/shapes
 *
 * GLSL distance functions for flat shapes: `sdRoundRect`, a rectangle
 * with rounded corners.
 */

/** The shape helpers. */
export const SHAPES_GLSL = /* glsl */ `// the signed distance to a rectangle of half-size b, its corners rounded by r
float sdRoundRect(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
`;
