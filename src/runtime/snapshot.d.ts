import type { SceneDefinition, SceneOptions, SnapshotOutput } from '../types.js';

/** One still at an exact size, as an image (PNG by default), rendered off screen. */
export function snapshot(def: SceneDefinition, options?: SceneOptions, output?: SnapshotOutput): Promise<Blob>;
