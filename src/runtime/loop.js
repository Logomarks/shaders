/**
 * @module @arraypress/shaders/runtime/loop
 *
 * A running scene's frame loop: it draws at `fps` (30 by default: these
 * move slowly), not at the screen's 60 or 120, and when frames come much
 * later than asked for, the device is struggling, so it steps its
 * resolution down (by a fifth at a time, to `minScale`).
 */

/**
 * @typedef {import('./loop.js').FrameLoop} FrameLoop
 */

/**
 * A frame loop.
 *
 * @param {{ fps: number, scale: number, minScale: number }} pace Frames a second, the resolution to start at, and the lowest it steps down to.
 * @param {() => boolean} shouldRun Whether to keep going (checked each frame).
 * @param {(seconds: number) => void} onFrame Draws a frame, given the seconds since the last (0 for the first).
 * @returns {FrameLoop} The loop.
 */
export function frameLoop(pace, shouldRun, onFrame) {
	let { fps, scale, minScale } = pace;
	let raf = 0;
	let last = 0;
	let late = 0;

	/** @param {number} now The frame's time, ms. */
	const tick = (now) => {
		raf = 0;
		if (!shouldRun()) return;
		raf = requestAnimationFrame(tick);
		const step = 1000 / fps;
		if (last && now - last < step - 2) return; // not yet: hold the frame rate down (the first frame draws at once)
		// frames coming much later than asked for: the device is struggling, so draw fewer pixels
		late = last && now - last > step * 1.8 ? late + 1 : Math.max(0, late - 1);
		if (late > 12 && scale > minScale) {
			scale = Math.max(minScale, scale * 0.8);
			late = 0;
		}
		const seconds = last ? (now - last) / 1000 : 0;
		last = now;
		onFrame(seconds);
	};

	return {
		get running() {
			return raf !== 0;
		},
		get scale() {
			return scale;
		},
		set scale(s) {
			scale = s;
		},
		set fps(f) {
			fps = f;
		},
		set minScale(s) {
			minScale = s;
		},
		start() {
			last = 0;
			if (!raf) raf = requestAnimationFrame(tick);
		},
		cancel() {
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
		},
	};
}
