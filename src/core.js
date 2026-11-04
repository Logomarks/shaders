/**
 * @module @arraypress/shaders/core
 *
 * The engine under every scene, without any scene's shader: it runs a
 * scene definition (a module from `@arraypress/shaders/<name>`, or one of
 * your own made with `define`) on a canvas, renders stills off screen, and
 * turns options into the uniforms the shaders read. Each part is its own
 * module in `./runtime/`; this entry gathers them.
 *
 * Nothing here touches the DOM until a scene is started, so it imports
 * safely in Node (for the option and uniform helpers) and during server
 * rendering.
 */

export { LOOK, LOOK_PARAMS, STILL_TIME } from './runtime/look.js';
export { rgb } from './runtime/color.js';
export { validateOptions, resolveSettings } from './runtime/options.js';
export { uniformValues } from './runtime/uniforms.js';
export { compile } from './runtime/gl.js';
export { weakDevice } from './runtime/device.js';
export { fallback } from './runtime/fallback.js';
export { scene } from './runtime/scene.js';
export { renderer } from './runtime/renderer.js';
export { snapshot } from './runtime/snapshot.js';
export { HEAD } from './head.js';
export { define, MAX_PARAMS } from './define.js';
