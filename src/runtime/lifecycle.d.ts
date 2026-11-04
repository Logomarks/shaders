import type { SceneDefinition } from '../types.js';
import type { Program } from './gl.js';

/** What a lazy context tells its scene. */
export interface LifecycleHooks {
	/** How near the screen counts as near, a CSS length (`200px`). */
	margin: string;
	/** The canvas came near the screen, or left it. */
	onNear(near: boolean): void;
	/** The canvas changed size. */
	onResize(): void;
	/** A context and program were made: hand them the scene's settings. */
	onReady(gl: WebGL2RenderingContext, prog: Program): void;
	/** The browser took the context. */
	onLost(): void;
	/** The context is being given back (stop drawing). */
	onRelease(): void;
}

/** A canvas's lazy WebGL context: made near the screen, given back on a fresh canvas after leaving it. */
export interface LazyContext {
	/** The canvas now: a fresh one after each release. */
	readonly canvas: HTMLCanvasElement;
	/** The context and program, while it holds them. */
	readonly held: { gl: WebGL2RenderingContext; prog: Program } | null;
	/** Whether it watches for the screen (an IntersectionObserver exists); if not, the scene starts at once. */
	readonly observing: boolean;
	/** Makes a context and program on the current canvas. False without WebGL 2 or when the shader fails (it then stops trying). */
	acquire(): boolean;
	/** Gives the context back, and puts a fresh canvas in this one's place. */
	release(): void;
	/** Holds a context, starting again on a fresh canvas if the browser took the last one. */
	ensure(): boolean;
	/** Gives the context back in four seconds, unless `stay()` comes first. */
	leaveSoon(): void;
	/** Keeps the context (cancels `leaveSoon`). */
	stay(): void;
	/** Stops watching, and frees the context: all of it for a canvas it made (`own`) or one off the page, only the program for a page canvas another scene may reuse. */
	dispose(own: boolean): void;
}

/** How long a lazy scene keeps its context after leaving the screen, ms: 4000. */
export const AWAY_MS: number;
/** A canvas's lazy context. */
export function lazyContext(first: HTMLCanvasElement, def: SceneDefinition, hooks: LifecycleHooks): LazyContext;
