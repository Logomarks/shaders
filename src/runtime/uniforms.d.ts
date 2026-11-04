import type { SceneDefinition, SceneSettings } from '../types.js';
import type { Program } from './gl.js';

/** The uniforms every scene's shader declares. */
export const UNIFORMS: readonly string[];
/** The uniform values for a scene's settings, by uniform name (`uP[0]`: its six settings). */
export function uniformValues(def: SceneDefinition, settings: SceneSettings): Record<string, number | number[]>;
/** Hands a scene's settings to its program. */
export function pushUniforms(gl: WebGL2RenderingContext, prog: Program, def: SceneDefinition, settings: SceneSettings): void;
