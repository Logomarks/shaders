import type { SceneDefinition } from './core.js';

/** The most settings a scene may have: 6. */
export const MAX_PARAMS: number;
/** A CSS hex colour, `#rgb` or `#rrggbb`. */
export const HEX: RegExp;
/** Checks a scene definition and freezes it. Throws a TypeError naming what is wrong. */
export function define(def: SceneDefinition): Readonly<SceneDefinition>;
