/**
 * @module @arraypress/shaders/runtime/gl
 *
 * The WebGL 2 under every scene: the context it asks for, compiling a
 * scene's fragment shader over one full-screen triangle, drawing a frame,
 * and giving a context back.
 */

import { UNIFORMS } from './uniforms.js';

/**
 * @typedef {import('./gl.js').Program} Program
 */

/** The full-screen triangle's vertex shader. */
const VERTEX = `#version 300 es
in vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

/** The context every scene asks for: opaque, no depth, no antialiasing, the low-power GPU. */
export const CONTEXT = Object.freeze({ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false });

/**
 * Compiles one stage.
 *
 * @param {WebGL2RenderingContext} gl The context.
 * @param {number} type The stage.
 * @param {string} source Its source.
 * @returns {WebGLShader} The shader.
 * @throws {Error} When it doesn't compile (with the log).
 */
function stage(gl, type, source) {
	const s = /** @type {WebGLShader} */ (gl.createShader(type));
	gl.shaderSource(s, source);
	gl.compileShader(s);
	if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(`Shader did not compile: ${gl.getShaderInfoLog(s)}`);
	return s;
}

/**
 * Compiles a scene's fragment shader with the triangle's vertex shader,
 * binds the triangle, and finds the uniforms.
 *
 * @param {WebGL2RenderingContext} gl The context.
 * @param {string} fragment The fragment shader.
 * @returns {Program} The program, its triangle and its uniforms.
 * @throws {Error} When the shader doesn't compile or link (with the log).
 */
export function compile(gl, fragment) {
	const program = /** @type {WebGLProgram} */ (gl.createProgram());
	const vs = stage(gl, gl.VERTEX_SHADER, VERTEX);
	const fs = stage(gl, gl.FRAGMENT_SHADER, fragment);
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.bindAttribLocation(program, 0, 'p');
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(`Shader did not link: ${gl.getProgramInfoLog(program)}`);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	gl.useProgram(program);
	const buffer = /** @type {WebGLBuffer} */ (gl.createBuffer());
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	/** @type {Program['u']} */
	const u = {};
	for (const name of UNIFORMS) u[name] = gl.getUniformLocation(program, name);
	return { program, buffer, u };
}

/**
 * Draws a frame.
 *
 * @param {WebGL2RenderingContext} gl The context.
 * @param {Program} prog The program.
 * @param {number} width The buffer's width, px.
 * @param {number} height Its height, px.
 * @param {number} time The scene's time (uTime), seconds.
 * @param {readonly number[]} mouse The pointer, 0–1 from the bottom left.
 */
export function drawFrame(gl, prog, width, height, time, mouse) {
	gl.useProgram(prog.program);
	gl.viewport(0, 0, width, height);
	gl.uniform2f(prog.u.uRes, width, height);
	gl.uniform1f(prog.u.uTime, time);
	gl.uniform2f(prog.u.uMouse, mouse[0], mouse[1]);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/**
 * Gives a context back to the browser now, rather than when it is collected.
 *
 * @param {WebGL2RenderingContext | null | undefined} gl The context.
 */
export const loseContext = (gl) => gl?.getExtension('WEBGL_lose_context')?.loseContext();
