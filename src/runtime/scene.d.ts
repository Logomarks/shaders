import type { SceneDefinition, SceneOptions, SceneHandle } from '../types.js';

/** Runs a scene on a `<canvas>`, or in an element (a canvas of its own made inside it: use this in React, Svelte or Vue). */
export function scene(target: Element, def: SceneDefinition, options?: SceneOptions): SceneHandle;
