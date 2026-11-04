/** The pointer a scene follows. */
export interface Pointer {
	/** Where it is, 0–1 from the canvas's bottom left (the centre until it moves). */
	readonly mouse: readonly [number, number];
	/** Stops following it. */
	stop(): void;
}

/** Follows the pointer: over the canvas's area (`true` or left out), over an element given, or not at all (`false`). */
export function followPointer(option: boolean | Element | undefined, canvas: () => Element, active: () => boolean): Pointer;
