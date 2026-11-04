/**
 * @module @arraypress/shaders/runtime/look
 *
 * The look every scene takes (colour, framing, grain and pace) and its
 * defaults, the look's settings for a settings panel, and the time a
 * still shows.
 */

/** The look every scene starts from, before its own. */
export const LOOK = Object.freeze({
	speed: 1,
	hue: 0,
	sat: 1,
	exposure: 1,
	tint: '#d4ff3a',
	tintAmount: 0,
	zoom: 1,
	angle: 0,
	grain: 1,
});

/** The look's keys, in order. */
export const LOOK_KEYS = /** @type {readonly (keyof typeof LOOK)[]} */ (Object.freeze(Object.keys(LOOK)));

/** The look's number settings with labels and ranges, in the order a settings panel shows them. */
export const LOOK_PARAMS = Object.freeze(
	[
		{ key: 'speed', label: 'Speed', min: 0, max: 3, step: 0.05, default: 1 },
		{ key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, default: 0 },
		{ key: 'sat', label: 'Saturation', min: 0, max: 2, step: 0.02, default: 1 },
		{ key: 'exposure', label: 'Brightness', min: 0.3, max: 2, step: 0.02, default: 1 },
		{ key: 'tintAmount', label: 'Tint', min: 0, max: 1, step: 0.02, default: 0 },
		{ key: 'zoom', label: 'Zoom', min: 0.5, max: 2.5, step: 0.02, default: 1 },
		{ key: 'angle', label: 'Angle', min: -180, max: 180, step: 1, default: 0 },
		{ key: 'grain', label: 'Grain', min: 0, max: 3, step: 0.05, default: 1 },
	].map((p) => Object.freeze(p)),
);

/** Seconds into a scene that a still (reduced motion, `snapshot`) shows by default. */
export const STILL_TIME = 4;
