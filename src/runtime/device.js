/**
 * @module @arraypress/shaders/runtime/device
 *
 * What the device and the visitor ask for: a weak device starts at a
 * lower resolution, reduced motion gets one still frame, and a hidden tab
 * gets none. Each is safe to call outside a browser.
 */

/**
 * Is this a low-powered device (four cores or fewer, 4 GB or less, or data saver on)?
 *
 * @returns {boolean} True when it should start at a lower resolution.
 */
export function weakDevice() {
	if (typeof navigator === 'undefined') return false;
	const n = /** @type {Navigator & { deviceMemory?: number, connection?: { saveData?: boolean } }} */ (navigator);
	return (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 4 || n.connection?.saveData === true;
}

/**
 * Has the visitor asked for less motion?
 *
 * @returns {boolean} True with prefers-reduced-motion: reduce.
 */
export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Is the tab hidden?
 *
 * @returns {boolean} True when it is.
 */
export const hidden = () => typeof document !== 'undefined' && document.hidden;
