/**
 * @arraypress/shaders — WebGL 2 scene shaders. This entry takes in every
 * scene; its functions take a scene by name or by definition.
 */

import type { SceneDefinition, SceneOptions, SceneSettings, SceneHandle, Renderer, SnapshotOutput, SceneParam } from './core.js';

export type { SceneDefinition, SceneOptions, SceneSettings, SceneHandle, Renderer, SnapshotOutput, SceneParam, SceneLook, Palette } from './core.js';
export { LOOK, LOOK_PARAMS, STILL_TIME, MAX_PARAMS, HEAD, define, rgb, weakDevice, compile } from './core.js';
export { load, NAMES } from './load.js';

export { marble } from './scenes/marble.js';
export { frosted } from './scenes/frosted.js';
export { ribs } from './scenes/ribs.js';
export { tiles } from './scenes/tiles.js';
export { blob } from './scenes/blob.js';
export { chrome } from './scenes/chrome.js';
export { glitter } from './scenes/glitter.js';
export { foil } from './scenes/foil.js';
export { ribbon } from './scenes/ribbon.js';
export { spiral } from './scenes/spiral.js';
export { swirl } from './scenes/swirl.js';
export { arches } from './scenes/arches.js';
export { spheres } from './scenes/spheres.js';
export { spheres2 } from './scenes/spheres2.js';
export { strands } from './scenes/strands.js';
export { rings } from './scenes/rings.js';
export { inkWater } from './scenes/ink-water.js';
export { topo } from './scenes/topo.js';
export { oilBubbles } from './scenes/oil-bubbles.js';
export { meltingHologram } from './scenes/melting-hologram.js';

/** A scene's name. */
export type SceneName =
	| 'marble'
	| 'frosted'
	| 'ribs'
	| 'tiles'
	| 'blob'
	| 'chrome'
	| 'glitter'
	| 'foil'
	| 'ribbon'
	| 'spiral'
	| 'swirl'
	| 'arches'
	| 'spheres'
	| 'spheres2'
	| 'strands'
	| 'rings'
	| 'ink-water'
	| 'topo'
	| 'oil-bubbles'
	| 'melting-hologram';

/** A scene, by name or definition. */
export type SceneRef = SceneName | SceneDefinition;

/** Every scene's name, title and description, by name, in order. */
export const SCENES: Readonly<Record<SceneName, Readonly<{ name: SceneName; title: string; description: string }>>>;
/** Every scene's own settings (key, label, range, step, default), by name, in the order its shader reads them: for building settings panels. */
export const PARAMS: Readonly<Record<SceneName, readonly Readonly<SceneParam>[]>>;

/** A scene's definition by name (a definition is returned as it is). Throws a TypeError for an unknown name. */
export function definition(name: SceneRef): SceneDefinition;

/** Runs a scene on a `<canvas>`, or in an element (a canvas of its own made inside it: use this in React, Svelte or Vue). */
export function scene(target: Element, name: SceneRef, options?: SceneOptions): SceneHandle;
/** One still at an exact size, as an image (PNG by default), rendered off screen. */
export function snapshot(name: SceneRef, options?: SceneOptions, output?: SnapshotOutput): Promise<Blob>;
/** A renderer for stills and frame sequences at an exact size: one context, one compile. */
export function renderer(name: SceneRef, options: SceneOptions | undefined, size: { width: number; height: number }): Renderer;
/** Checks a scene's options. Throws a TypeError or RangeError naming what is wrong. */
export function validateOptions(name: SceneRef, options?: SceneOptions): void;
/** A scene's settings from its options. */
export function resolveSettings(name: SceneRef, options?: SceneOptions, current?: SceneSettings): SceneSettings;
/** The uniform values for a scene's settings, by uniform name. */
export function uniformValues(name: SceneRef, settings: SceneSettings): Record<string, number | number[]>;
/** A still CSS background for a scene, for before it draws and where there is no WebGL 2. */
export function fallback(name: SceneRef, options?: SceneOptions): string;
