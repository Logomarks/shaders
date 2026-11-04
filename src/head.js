/**
 * @module @arraypress/shaders/head
 *
 * The GLSL every scene starts with, put together from `src/glsl/`: its
 * uniforms, the palette helpers that bring any colour to the part it
 * plays (`lift`, `lower`, `vivid`, `hueTurn`, `loop3`), `sceneUv()` for
 * where a pixel is, noise (`noise`, `fbm`, `soft`), `sdRoundRect`,
 * `glassRoom()` (a studio for glass to reflect) and `finish()` (the look's
 * colour, a vignette and grain).
 */

import { UNIFORMS_GLSL } from './glsl/uniforms.js';
import { PALETTE_GLSL } from './glsl/palette.js';
import { SPACE_GLSL } from './glsl/space.js';
import { NOISE_GLSL } from './glsl/noise.js';
import { SHAPES_GLSL } from './glsl/shapes.js';
import { STUDIO_GLSL } from './glsl/studio.js';
import { FINISH_GLSL } from './glsl/finish.js';

/** The shared head of every scene's fragment shader (WebGL 2, GLSL ES 3.00). */
export const HEAD = UNIFORMS_GLSL + PALETTE_GLSL + SPACE_GLSL + NOISE_GLSL + SHAPES_GLSL + STUDIO_GLSL + FINISH_GLSL;
