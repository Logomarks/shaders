import type { SceneDefinition } from './core.js';
import type { SceneName } from './index.js';

/** Every scene's name, in order. */
export const NAMES: readonly SceneName[];

/** A scene's definition by name, each scene in its own chunk. Rejects with a TypeError for an unknown name. */
export function load(name: SceneName): Promise<SceneDefinition>;
