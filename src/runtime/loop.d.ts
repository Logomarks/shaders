/** A running scene's frame loop: the fps cap and the resolution it steps down while frames come late. */
export interface FrameLoop {
	/** Whether a frame is asked for. */
	readonly running: boolean;
	/** The share of CSS pixels to draw at now. */
	scale: number;
	/** Frames a second. */
	fps: number;
	/** The lowest share it steps down to. */
	minScale: number;
	/** Starts asking for frames (the first draws at once). */
	start(): void;
	/** Stops asking for frames. */
	cancel(): void;
}

/** A frame loop at `pace`, running while `shouldRun()`, calling `onFrame` with the seconds since the last frame (0 for the first). */
export function frameLoop(pace: { fps: number; scale: number; minScale: number }, shouldRun: () => boolean, onFrame: (seconds: number) => void): FrameLoop;
