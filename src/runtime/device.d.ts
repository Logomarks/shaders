/** Is this a low-powered device (four cores or fewer, 4 GB or less, or data saver on)? */
export function weakDevice(): boolean;
/** Has the visitor asked for less motion (prefers-reduced-motion: reduce)? */
export function reducedMotion(): boolean;
/** Is the tab hidden? */
export function hidden(): boolean;
