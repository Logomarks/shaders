/**
 * @module @logomarks/shaders/runtime/pointer
 *
 * Follows the pointer for a scene, 0–1 from its canvas's bottom left: by
 * default anywhere over the canvas's area, whatever is on top of it (the
 * window is listened on); over an element given instead, wherever it is;
 * or not at all.
 */

/**
 * @typedef {import('./pointer.js').Pointer} Pointer
 */

/**
 * Follows the pointer.
 *
 * @param {boolean | Element | undefined} option `true` (or left out) over the canvas's area, an element to listen on, or `false`.
 * @param {() => Element} canvas The canvas now (a lazy scene swaps it).
 * @param {() => boolean} active Whether to follow it now (the scene is near the screen).
 * @returns {Pointer} The pointer and how to stop following it.
 */
export function followPointer(option, canvas, active) {
	const mouse = /** @type {[number, number]} */ ([0.5, 0.5]);
	const overCanvasOnly = option === undefined || option === true;
	/** @param {PointerEvent} e The move. */
	const onMove = (e) => {
		if (!active()) return;
		const b = canvas().getBoundingClientRect();
		const x = (e.clientX - b.left) / b.width;
		const y = 1 - (e.clientY - b.top) / b.height;
		if (overCanvasOnly && !(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return;
		mouse[0] = x;
		mouse[1] = y;
	};
	const target = option === false ? null : option && option !== true ? option : typeof window === 'undefined' ? null : window;
	target?.addEventListener('pointermove', /** @type {EventListener} */ (onMove), { passive: true });
	return {
		mouse,
		stop: () => target?.removeEventListener('pointermove', /** @type {EventListener} */ (onMove)),
	};
}
