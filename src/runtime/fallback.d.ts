import type { SceneDefinition, SceneOptions } from '../types.js';

/** A still CSS background (its colours as soft blooms over its ground) for before it draws and where there is no WebGL 2. */
export function fallback(def: SceneDefinition, options?: SceneOptions): string;
