import type { SceneDefinition, SceneOptions, Renderer } from '../types.js';

/** A renderer for stills and frame sequences at an exact size: one context, one compile. */
export function renderer(def: SceneDefinition, options: SceneOptions | undefined, size: { width: number; height: number }): Renderer;
