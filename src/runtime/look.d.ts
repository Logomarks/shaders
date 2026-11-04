import type { SceneLook, SceneParam } from '../types.js';

/** The look every scene starts from, before its own. */
export const LOOK: Readonly<Required<SceneLook>>;
/** The look's keys, in order. */
export const LOOK_KEYS: readonly (keyof SceneLook)[];
/** The look's number settings with labels and ranges, in the order a settings panel shows them. */
export const LOOK_PARAMS: readonly Readonly<SceneParam>[];
/** Seconds into a scene that a still (reduced motion, `snapshot`) shows by default: 4. */
export const STILL_TIME: number;
