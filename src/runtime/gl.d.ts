/** A scene's compiled program: the program, its full-screen triangle, and its uniforms by name. */
export interface Program {
	/** The linked program. */
	program: WebGLProgram;
	/** The full-screen triangle. */
	buffer: WebGLBuffer;
	/** The uniforms' locations, by name (`uP[0]` for the params). */
	u: Record<string, WebGLUniformLocation | null>;
}

/** The context every scene asks for: opaque, no depth, no antialiasing, the low-power GPU. */
export const CONTEXT: Readonly<WebGLContextAttributes>;
/** Compiles a fragment shader with the full-screen triangle, and finds the scene uniforms. Throws with the log when it fails. */
export function compile(gl: WebGL2RenderingContext, fragment: string): Program;
/** Draws a frame at a size, a time (seconds) and a pointer (0–1 from the bottom left). */
export function drawFrame(gl: WebGL2RenderingContext, prog: Program, width: number, height: number, time: number, mouse: readonly number[]): void;
/** Gives a context back to the browser now, rather than when it is collected. */
export function loseContext(gl: WebGL2RenderingContext | null | undefined): void;
