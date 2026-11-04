/**
 * @arraypress/shaders — the runner's lifecycle, in a pretend browser
 * (tests/fake-browser.js): the lazy context (made near the screen, given
 * back four seconds after leaving it, a fresh canvas each time), the frame
 * cap, reduced motion, pausing when hidden, frame(t), set(), stop(), and the
 * off-screen renderer. The browser check draws them on a real GPU.
 */

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { install, fakeGl } from './fake-browser.js';
import { scene, renderer, snapshot } from '../src/core.js';
import { marble, glitter } from '../src/index.js';

/** @type {any} */
let env;

/**
 * A canvas on a page.
 *
 * @returns {{ page: any, canvas: any }} The page element and its canvas.
 */
function page() {
	const el = new env.FakeElement();
	const canvas = el.appendChild(new env.FakeCanvas());
	return { page: el, canvas };
}

describe('scene(): the lazy context', () => {
	beforeEach(() => {
		env = install();
		mock.timers.enable({ apis: ['setTimeout'] });
	});
	afterEach(() => {
		mock.timers.reset();
		env.uninstall();
	});

	it('makes no context until the canvas comes near the screen', () => {
		const { canvas } = page();
		const h = scene(canvas, marble);
		assert.equal(env.contexts.length, 0);
		assert.equal(env.observers[0].options.rootMargin, '200px 0px');
		env.view(canvas, true);
		assert.equal(env.contexts.length, 1);
		assert.ok(canvas.hasAttribute('data-gl'));
		h.stop();
	});

	it('gives the context back four seconds after leaving, on a fresh canvas', () => {
		const { page: el, canvas } = page();
		const h = scene(canvas, marble);
		env.view(canvas, true);
		env.view(canvas, false);
		mock.timers.tick(3999);
		assert.equal(env.contexts[0].lost, false, 'not yet');
		mock.timers.tick(1);
		assert.equal(env.contexts[0].lost, true);
		assert.notEqual(h.canvas, canvas, 'a fresh canvas');
		assert.equal(el.children[0], h.canvas, 'in the old one’s place');
		assert.equal(h.canvas.hasAttribute('data-gl'), false);
		env.view(h.canvas, true);
		assert.equal(env.contexts.length, 2, 'a new context on the fresh canvas');
		assert.equal(env.contexts[1], h.canvas.gl);
		h.stop();
	});

	it('keeps the context when it comes back within four seconds', () => {
		const { canvas } = page();
		const h = scene(canvas, marble);
		env.view(canvas, true);
		env.view(canvas, false);
		mock.timers.tick(2000);
		env.view(canvas, true);
		mock.timers.tick(5000);
		assert.equal(env.contexts.length, 1);
		assert.equal(env.contexts[0].lost, false);
		h.stop();
	});

	it('takes a margin from lazy, and with lazy: false holds a context from the start and never gives it back', () => {
		const a = page();
		const h1 = scene(a.canvas, marble, { lazy: '600px' });
		assert.equal(env.observers.at(-1).options.rootMargin, '600px 0px');
		const b = page();
		const h2 = scene(b.canvas, marble, { lazy: false });
		assert.equal(env.contexts.length, 1);
		env.view(b.canvas, true);
		env.view(b.canvas, false);
		mock.timers.tick(10000);
		assert.equal(env.contexts[0].lost, false);
		assert.equal(h2.canvas, b.canvas);
		h1.stop();
		h2.stop();
	});

	it('starts again on a fresh canvas when the browser takes its context', () => {
		const { canvas } = page();
		const h = scene(canvas, marble);
		env.view(canvas, true);
		canvas.dispatch('webglcontextlost');
		env.view(canvas, false);
		env.view(canvas, true);
		assert.notEqual(h.canvas, canvas);
		assert.equal(env.contexts.length, 2);
		h.stop();
	});

	it('in an element, makes and removes a canvas of its own', () => {
		const el = new env.FakeElement();
		const h = scene(el, marble);
		assert.equal(el.children.length, 1);
		assert.equal(el.children[0], h.canvas);
		assert.match(h.canvas.style.cssText, /width:100%;height:100%/);
		env.view(h.canvas, true);
		h.stop();
		assert.equal(el.children.length, 0);
		assert.equal(env.contexts[0].lost, true);
	});
});

describe('scene(): drawing', () => {
	beforeEach(() => {
		env = install();
		mock.timers.enable({ apis: ['setTimeout'] });
	});
	afterEach(() => {
		mock.timers.reset();
		env.uninstall();
	});

	it('draws at the fps cap, its clock running at the look’s speed', () => {
		const { canvas } = page();
		const h = scene(canvas, marble, { speed: 2, fps: 30 });
		env.view(canvas, true);
		for (let i = 0; i < 61; i++) env.tick(1000 / 60);
		const times = env.times(env.contexts[0]);
		assert.ok(times.length >= 29 && times.length <= 31, `about 30 frames in a second at 60 Hz, got ${times.length}`);
		assert.ok(Math.abs(times.at(-1) - 2) < 0.1, `two seconds of scene time in one at speed 2, got ${times.at(-1)}`);
		h.stop();
	});

	it('sizes the buffer at the scene’s scale, never above one device pixel per CSS pixel', () => {
		const { canvas } = page();
		const h = scene(canvas, marble, { scale: 0.5 });
		env.view(canvas, true);
		env.tick();
		const k = 0.5 * (canvas.width === 200 ? 1 : 0.75); // (three quarters on a weak device)
		assert.equal(canvas.width, Math.round(400 * k));
		assert.equal(canvas.height, Math.round(500 * k));
		h.stop();
	});

	it('steps the resolution down while frames come late, to minScale', () => {
		const { canvas } = page();
		const h = scene(canvas, marble, { scale: 1, minScale: 0.5 });
		env.view(canvas, true);
		env.tick(10);
		const full = canvas.width;
		for (let i = 0; i < 200; i++) env.tick(120); // every frame four times late
		assert.ok(canvas.width < full);
		assert.equal(canvas.width, Math.round(400 * 0.5 * (full === 400 ? 1 : 0.75)));
		h.stop();
	});

	it('draws nothing while away or hidden, and starts again when shown', () => {
		const { canvas } = page();
		const h = scene(canvas, marble);
		env.view(canvas, true);
		env.tick();
		env.tick(40);
		const drawn = env.times(env.contexts[0]).length;
		env.document.hidden = true;
		for (let i = 0; i < 10; i++) env.tick(40);
		assert.equal(env.times(env.contexts[0]).length, drawn, 'hidden');
		assert.equal(env.frames.size, 0, 'no frames queued');
		env.document.hidden = false;
		env.document.dispatch('visibilitychange');
		env.tick(40);
		env.tick(40);
		assert.ok(env.times(env.contexts[0]).length > drawn, 'shown again');
		env.view(canvas, false);
		const before = env.times(env.contexts[0]).length;
		env.tick(40);
		assert.equal(env.times(env.contexts[0]).length, before, 'away');
		h.stop();
	});

	it('with reduced motion, draws one frame four seconds in, and no loop', () => {
		env.uninstall();
		env = install({ reducedMotion: true });
		const { canvas } = page();
		const h = scene(canvas, glitter, { speed: 1.5 });
		env.view(canvas, true);
		assert.deepEqual(env.times(env.contexts[0]), [6]);
		assert.equal(env.frames.size, 0);
		h.set({ hue: 30 });
		assert.deepEqual(env.times(env.contexts[0]), [6, 6], 'a change shows at once');
		h.stop();
	});

	it('set() hands new settings to the shader and redraws a still scene', () => {
		const { canvas } = page();
		const h = scene(canvas, marble);
		env.view(canvas, true);
		h.pause();
		const gl = env.contexts[0];
		gl.calls.length = 0;
		h.set({ params: { warp: 3 }, colors: ['#ff0000'] });
		const p = gl.calls.find((/** @type {any[]} */ c) => c[0] === 'uniform1fv');
		assert.deepEqual([...p[2]], [1.1, 0.8, 3, 0.6, 0, 0].map(Math.fround));
		assert.ok(gl.calls.some((/** @type {any[]} */ c) => c[0] === 'uniform3fv' && c[1] === 'uC1' && c[2][0] === 1 && c[2][1] === 0));
		assert.equal(env.times(gl).length, 1, 'redrawn');
		assert.deepEqual(h.settings().colors[0], '#ff0000');
		assert.throws(() => h.set({ lazy: false }), /set when a scene starts/);
		assert.throws(() => h.set({ params: { nope: 1 } }), /has no param "nope"/);
		h.stop();
	});

	it('frame(t) pauses and draws t seconds in at its speed, making a context if it has none', () => {
		const { canvas } = page();
		const h = scene(canvas, marble, { speed: 0.5 });
		assert.equal(h.frame(10), canvas);
		assert.equal(env.contexts.length, 1);
		assert.deepEqual(env.times(env.contexts[0]), [5]);
		env.view(canvas, true);
		env.tick(40);
		assert.deepEqual(env.times(env.contexts[0]), [5, 5], 'stays paused on it');
		h.play();
		env.tick(40);
		env.tick(40);
		assert.ok(env.times(env.contexts[0]).at(-1) > 5, 'runs on from it');
		assert.throws(() => h.frame(NaN), TypeError);
		h.stop();
	});

	it('follows the pointer over the canvas’s area, wherever the event lands', () => {
		const { canvas } = page();
		const h = scene(canvas, marble);
		env.view(canvas, true);
		env.window.dispatch('pointermove', { clientX: 100, clientY: 125 });
		env.window.dispatch('pointermove', { clientX: 900, clientY: 125 }); // off the canvas: ignored
		h.frame(1);
		const m = env.contexts[0].calls.filter((/** @type {any[]} */ c) => c[0] === 'uniform2f' && c[1] === 'uMouse').at(-1);
		assert.deepEqual(m.slice(2), [0.25, 0.75]);
		h.stop();
		assert.equal(env.window.listeners.get('pointermove')?.size ?? 0, 0, 'listener removed');
	});

	it('stop() ends everything and gives a context back, but keeps one a page canvas could reuse', () => {
		const { canvas } = page();
		const h = scene(canvas, marble);
		env.view(canvas, true);
		h.stop();
		assert.equal(env.frames.size, 0);
		assert.equal(env.contexts[0].lost, false, 'the canvas is still on the page: kept for reuse');
		assert.ok(env.contexts[0].calls.some((/** @type {any[]} */ c) => c[0] === 'deleteProgram'));
		const again = scene(canvas, marble);
		env.view(canvas, true);
		assert.equal(env.contexts.length, 1, 'the same context, reused');
		canvas.remove();
		again.stop();
		assert.equal(env.contexts[0].lost, true, 'off the page: given back');
		assert.equal(h.frame(1), null, 'a stopped scene draws nothing');
	});
});

describe('scene(): without what it needs', () => {
	afterEach(() => env.uninstall());

	it('without WebGL 2 draws nothing and doesn’t try again', () => {
		env = install({ noWebGl: true });
		const { canvas } = page();
		const h = scene(canvas, marble);
		env.view(canvas, true);
		assert.equal(h.frame(1), null);
		h.stop();
	});

	it('warns once when its shader fails, and gives the context back', () => {
		env = install({ failCompile: true });
		const warn = mock.method(console, 'warn', () => {});
		const { canvas } = page();
		const h = scene(canvas, marble);
		env.view(canvas, true);
		env.view(canvas, false);
		env.view(canvas, true);
		assert.equal(warn.mock.callCount(), 1);
		assert.match(String(warn.mock.calls[0].arguments.join(' ')), /marble Shader did not compile: ERROR/);
		assert.equal(env.contexts[0].lost, true);
		warn.mock.restore();
		h.stop();
	});

	it('without IntersectionObserver, starts at once', () => {
		env = install({ observer: false });
		const { canvas } = page();
		const h = scene(canvas, marble);
		assert.equal(env.contexts.length, 1);
		h.stop();
	});

	it('refuses a target that isn’t an element', () => {
		env = install();
		assert.throws(() => scene(/** @type {any} */ ('#hero'), marble), /needs a <canvas> or an element/);
		assert.throws(() => scene(page().canvas, marble, /** @type {any} */ ({ colours: [] })), /Unknown scene option "colours"/);
	});
});

describe('renderer() and snapshot()', () => {
	/** @type {any[]} */
	let made;
	beforeEach(() => {
		made = [];
		/** @type {any} */ (globalThis).OffscreenCanvas = class {
			/** @param {number} w @param {number} h */
			constructor(w, h) {
				this.width = w;
				this.height = h;
				this.gl = fakeGl();
				made.push(this);
			}
			/** @param {string} type @param {any} attrs */
			getContext(type, attrs) {
				this.attrs = attrs;
				return this.gl;
			}
			/** @param {{ type: string }} o */
			async convertToBlob(o) {
				return new Blob(['png'], { type: o.type });
			}
		};
	});
	afterEach(() => delete (/** @type {any} */ (globalThis)).OffscreenCanvas);

	it('snapshot() draws one frame at the size and time asked, as an image, and gives the context back', async () => {
		const blob = await snapshot(marble, { speed: 2 }, { width: 1080, height: 1350, t: 3 });
		assert.equal(blob.type, 'image/png');
		const [c] = made;
		assert.equal(c.attrs.preserveDrawingBuffer, true);
		assert.deepEqual(c.gl.calls.find((/** @type {any[]} */ x) => x[0] === 'viewport').slice(1), [0, 0, 1080, 1350]);
		assert.deepEqual(c.gl.calls.filter((/** @type {any[]} */ x) => x[1] === 'uTime').map((/** @type {any[]} */ x) => x[2]), [6]);
		assert.equal(c.gl.lost, true);
		assert.equal((await snapshot(marble, {}, { type: 'image/webp', width: 10, height: 10 })).type, 'image/webp');
	});

	it('a renderer draws many frames on one context and one compile', () => {
		const r = renderer(marble, {}, { width: 64, height: 64 });
		for (let i = 0; i < 5; i++) r.draw(i / 30);
		const gl = made[0].gl;
		assert.equal(gl.calls.filter((/** @type {any[]} */ x) => x[0] === 'compileShader').length, 2);
		assert.equal(gl.calls.filter((/** @type {any[]} */ x) => x[0] === 'drawArrays').length, 5);
		r.set({ palette: { colors: ['#ff0000', '#00ff00', '#0000ff'], glint: '#ffffff' } });
		r.dispose();
		assert.throws(() => r.draw(1), /disposed/);
	});

	it('refuses sizes that aren’t whole pixels or are beyond the GPU', () => {
		assert.throws(() => renderer(marble, {}, { width: 0, height: 10 }), RangeError);
		assert.throws(() => renderer(marble, {}, { width: 10.5, height: 10 }), RangeError);
		assert.throws(() => renderer(marble, {}, { width: 5000, height: 10 }), /beyond this GPU's 4096×4096/);
		assert.equal(made.at(-1).gl.lost, true, 'its context given back');
	});
});
