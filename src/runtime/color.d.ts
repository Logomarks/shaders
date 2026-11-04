import type { Palette } from '../types.js';

/** A CSS hex colour, `#rgb` or `#rrggbb`. */
export const HEX: RegExp;
/** A hex colour as lower-case `#rrggbb`. */
export function longHex(hex: string): string;
/** A hex colour as RGB, 0–1 each. */
export function rgb(hex: string): [number, number, number];
/** Checks that a value is a hex colour. Throws a TypeError naming `what` when it isn't. */
export function checkHex(value: unknown, what: string): asserts value is string;
/** Checks a list of one to three hex colours. Throws a TypeError naming `what` when it isn't one. */
export function checkColors(list: unknown, what: string): asserts list is string[];
/** A scene's colours and glint over the ones it has: the palette's, then `colors`, then `glint`, each as lower-case `#rrggbb`. */
export function paletteColors(
	colors: readonly string[],
	glint: string,
	options: { palette?: Palette; colors?: readonly string[]; glint?: string },
): { colors: [string, string, string]; glint: string };
