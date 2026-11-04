/**
 * @arraypress/shaders/core — the engine, without any scene's shader.
 */

export type { SceneParam, Palette, SceneLook, SceneDefinition, SceneOptions, SceneSettings, SceneHandle, Renderer, SnapshotOutput } from './types.js';
export type { Program } from './runtime/gl.js';
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
