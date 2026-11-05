/**
 * @module @logomarks/shaders/runtime/color
 *
 * Hex colours and palettes. A palette is `{ colors: [three hex], glint }`,
 * the shape of `@arraypress/effects-astro`'s `PALETTES` (Lumetri, Forest,
 * Barbie, Uranium, Mono…), taken as data rather than imported, since
 * effects-astro depends on this package. A scene's colours go: its own,
 * then the palette's, then `colors` (any given replace those before, in
 * order), then `glint`.
 */

/** A CSS hex colour, `#rgb` or `#rrggbb`. */
export const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * A hex colour as lower-case `#rrggbb`.
 *
 * @param {string} hex `#rgb` or `#rrggbb`.
 * @returns {string} `#rrggbb`.
 */
export const longHex = (hex) => (hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex).toLowerCase();

/**
 * A hex colour as RGB, 0–1 each.
 *
 * @param {string} hex `#rgb` or `#rrggbb`.
 * @returns {[number, number, number]} Its channels.
 */
export function rgb(hex) {
	const h = longHex(hex);
	return /** @type {[number, number, number]} */ ([1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255));
}

/**
 * Checks that a value is a hex colour.
 *
 * @param {unknown} value The value.
 * @param {string} what What it is, for the message.
 * @throws {TypeError} When it isn't one.
 */
export function checkHex(value, what) {
	if (typeof value !== 'string' || !HEX.test(value)) throw new TypeError(`${what} must be a hex colour (#rgb or #rrggbb), not ${JSON.stringify(value)}`);
}

/**
 * Checks a list of one to three hex colours.
 *
 * @param {unknown} list The list.
 * @param {string} what What it is, for the message.
 * @throws {TypeError} When it isn't one.
 */
export function checkColors(list, what) {
	if (!Array.isArray(list) || list.length < 1 || list.length > 3) throw new TypeError(`${what} must be a list of one to three hex colours (the glint is \`glint\`)`);
	list.forEach((c, i) => checkHex(c, `${what}[${i}]`));
}

/**
 * A scene's colours and glint over the ones it has: the palette's, then
 * `colors`, then `glint`, each as lower-case `#rrggbb`.
 *
 * @param {readonly string[]} colors The three colours it has.
 * @param {string} glint The glint it has.
 * @param {{ palette?: import('../types.js').Palette, colors?: readonly string[], glint?: string }} options What to put over them.
 * @returns {{ colors: [string, string, string], glint: string }} Its colours and glint.
 */
export function paletteColors(colors, glint, options) {
	const out = [...colors];
	let g = glint;
	if (options.palette) {
		options.palette.colors.forEach((c, i) => (out[i] = c));
		if (options.palette.glint) g = options.palette.glint;
	}
	options.colors?.forEach((c, i) => (out[i] = c));
	if (options.glint) g = options.glint;
	return { colors: /** @type {[string, string, string]} */ (out.map(longHex)), glint: longHex(g) };
}
