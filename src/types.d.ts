/**
 * @logomarks/shaders — the types every module shares: a scene's
 * definition, its options and settings, a running scene's handle, and a
 * renderer.
 */

/** One of a scene's own settings: what it changes in the shape, its range, and its default (the scene as drawn). */
export interface SceneParam {
	/** Its key in `params`. */
	key: string;
	/** A label for a settings panel. */
	label: string;
	/** The least it takes. */
	min: number;
	/** The most it takes. */
	max: number;
	/** A slider's step. */
	step: number;
	/** The scene as drawn. */
	default: number;
}

/**
 * A palette: three colours and a glint (a highlight), as hex. The shape of
 * `@arraypress/effects-astro`'s `PALETTES` (`PALETTES.Barbie`…), which this
 * package takes as data rather than importing, since effects-astro depends on it.
 */
export interface Palette {
	/** One to three colours; any left out keep the scene's own. */
	colors: readonly string[];
	/** The highlight colour. Default: the scene's own. */
	glint?: string;
}

/** The look every scene takes: colour, framing, grain and pace. */
export interface SceneLook {
	/** How fast it moves: 0 still, 1 as made, 3 fast. Default: 1. */
	speed?: number;
	/** Hue turned round the colour wheel, degrees. Default: 0. */
	hue?: number;
	/** Saturation: 0 grey, 1 as made, 2 doubled. Default: 1. */
	sat?: number;
	/** Brightness: 0.3 dark … 2 bright. Default: 1. */
	exposure?: number;
	/** A colour to lean toward (a brand colour), hex. Default: `#d4ff3a`, at `tintAmount` 0. */
	tint?: string;
	/** How far toward `tint`: 0 none … 1 all (keeping the light and dark). Default: 0. */
	tintAmount?: number;
	/** Zoom: 0.5 … 2.5, more than 0. Default: 1. */
	zoom?: number;
	/** Rotation, degrees. Default: 0. */
	angle?: number;
	/** Film grain: 0 none … 3. Default: 1 (some scenes less). */
	grain?: number;
}

/** A scene: what `define` takes, and what every `@logomarks/shaders/<name>` module exports. */
export interface SceneDefinition {
	/** Its name, kebab-case: `marble`, `ink-water`. */
	readonly name: string;
	/** Its name for people: `Liquid marble`. */
	readonly title: string;
	/** A sentence on what it shows. */
	readonly description: string;
	/** The share of CSS pixels it draws at, (0, 1]: the soft scenes less, the fine ones more. */
	readonly scale: number;
	/** Its ground, hex: what the still fallback blooms its colours over. */
	readonly ground: string;
	/** Its own look: its three colours and glint, and any look settings it changes. */
	readonly look: Readonly<SceneLook & { colors: readonly [string, string, string]; glint: string }>;
	/** Its own settings, at most six, in the order its shader reads them (`uP[0]` …). */
	readonly params: readonly Readonly<SceneParam>[];
	/** Its fragment shader: GLSL ES 3.00, starting with `HEAD`. */
	readonly fragment: string;
}

/** How a scene is drawn: its look, its colours, its settings, and how the runner treats it. */
export interface SceneOptions extends SceneLook {
	/** One to three colours, hex, over the palette's and the scene's own. */
	colors?: readonly string[];
	/** A palette: `{ colors, glint }` (e.g. `PALETTES.Barbie` from `@arraypress/effects-astro`). Not a name. */
	palette?: Palette;
	/** The glint (a highlight), hex, over the palette's. */
	glint?: string;
	/** The scene's own settings by key (`PARAMS[name]`); any left out keep their default. */
	params?: Record<string, number | undefined>;
	/** Frames a second, more than 0. Default: 30. */
	fps?: number;
	/** The share of CSS pixels to draw at, (0, 1]. Default: the scene's own (0.45–0.85). */
	scale?: number;
	/** The lowest share it steps down to while frames come late, (0, 1]. Default: 0.3. */
	minScale?: number;
	/** Hold a WebGL context only while near the screen, giving it back 4 s after leaving: true, false, or how near as a CSS length. Default: true (`200px`). Set at start only. */
	lazy?: boolean | string;
	/** Follow the pointer: true over the canvas's area (whatever is on top), an element to listen on, or false. Default: true. Set at start only. */
	pointer?: boolean | Element;
}

/** A scene's settings, resolved: every look value, its colours, and every param. The shape `SceneOptions` takes, so they round-trip. */
export interface SceneSettings {
	/** How fast it moves: 0 still, 1 as made. */
	speed: number;
	/** Hue turned, degrees. */
	hue: number;
	/** Saturation: 0 grey, 1 as made. */
	sat: number;
	/** Brightness, 0.3–2. */
	exposure: number;
	/** The colour it leans toward, lower-case `#rrggbb`. */
	tint: string;
	/** How far toward `tint`, 0–1. */
	tintAmount: number;
	/** Zoom, more than 0. */
	zoom: number;
	/** Rotation, degrees. */
	angle: number;
	/** Film grain, 0–3. */
	grain: number;
	/** Its three colours, lower-case `#rrggbb`. */
	colors: [string, string, string];
	/** Its glint, lower-case `#rrggbb`. */
	glint: string;
	/** Every one of its own settings, by key. */
	params: Record<string, number>;
}

/** A running scene. */
export interface SceneHandle {
	/** The canvas it draws on now: a lazy scene swaps its canvas for a fresh one each time it gives its context back. */
	readonly canvas: HTMLCanvasElement;
	/** Changes its look, colours, params, `fps` or `scale`; shows the change at once, even when still. */
	set(options: SceneOptions): void;
	/** Its settings now (to save, or to start another scene the same). */
	settings(): SceneSettings;
	/**
	 * Pauses it and draws the frame `t` seconds in (at its speed), now, on its
	 * canvas, making a context if it has none. Returns the canvas, or null
	 * without WebGL 2. Read the canvas in the same task (`toBlob`,
	 * `drawImage`), before the browser clears it; `snapshot` and `renderer`
	 * draw at an exact size.
	 */
	frame(t: number): HTMLCanvasElement | null;
	/** Runs it again after `frame` or `pause` (still with reduced motion). */
	play(): void;
	/** Holds it on its current frame. */
	pause(): void;
	/** Stops it for good: no frames, no listeners. Its context is given back, unless its canvas is still on the page and was yours (it may be handed to another scene). A canvas it made is removed. */
	stop(): void;
}

/** A renderer for stills and frame sequences at an exact size. */
export interface Renderer {
	/** What it draws on: an OffscreenCanvas, or a detached canvas where there is none. */
	readonly canvas: OffscreenCanvas | HTMLCanvasElement;
	/** Changes its look, colours or params. */
	set(options: SceneOptions): void;
	/** Draws the frame `t` seconds in (at its speed; default 4), the pointer at `pointer` (0–1 from the bottom left; default the centre). */
	draw(t?: number, pointer?: readonly [number, number]): OffscreenCanvas | HTMLCanvasElement;
	/** The last frame as an image. Default: PNG. */
	toBlob(options?: { type?: string; quality?: number }): Promise<Blob>;
	/** Gives its context back. */
	dispose(): void;
}

/** A still's size, time and image type. */
export interface SnapshotOutput {
	/** Pixels. Default: 1200. */
	width?: number;
	/** Pixels. Default: 1200. */
	height?: number;
	/** Seconds in, at the scene's speed. Default: 4. */
	t?: number;
	/** The image type. Default: `image/png`. */
	type?: string;
	/** For `image/jpeg` and `image/webp`, 0–1. */
	quality?: number;
}
