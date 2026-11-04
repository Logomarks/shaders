import type { SceneDefinition, SceneOptions, SceneSettings } from '../types.js';

/** Checks a scene definition well enough to run it (`define` checks it fully). Throws a TypeError when it isn't one. */
export function checkDefinition(def: unknown): asserts def is SceneDefinition;
/** Checks a scene's options. Throws a TypeError (unknown key, wrong type, unknown param) or a RangeError (fps, zoom, scale out of range). */
export function validateOptions(def: SceneDefinition, options?: SceneOptions): void;
/** A scene's settings: the default look, the scene's own, `current`, then the options (colours: palette, then `colors`, then `glint`). */
export function resolveSettings(def: SceneDefinition, options?: SceneOptions, current?: SceneSettings): SceneSettings;
