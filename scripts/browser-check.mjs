/**
 * Renders every scene in a real browser and checks the pixels aren't
 * blank: each shader compiles and links on a real WebGL 2 driver, draws a
 * picture with light and shade in it through `snapshot()` (off screen) and
 * through a live `scene()` on a page canvas, and a lazy scene gives its
 * context back after leaving the screen.
 *
 *   npm run test:browser                       # Chrome with remote debugging on 9334
 *   CHROME_PORT=9222 npm run test:browser
 *   npm run test:browser -- --out sheet.png    # also writes a contact sheet of every scene
 *
 * Needs a Chrome started with --remote-debugging-port (headless is fine).
 * Serves this package on a local port, opens a tab, and closes it after.
 */

import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.CHROME_PORT ?? 9334);
const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null;
const TYPES = { '.js': 'text/javascript', '.html': 'text/html' };

/** Serves the package's files, and a blank page to run in. */
const server = createServer(async (req, res) => {
	const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
	if (path === '/') return res.writeHead(200, { 'content-type': 'text/html' }).end('<!doctype html><title>shaders check</title><body style="margin:0">');
	try {
		const body = await readFile(join(ROOT, path));
		res.writeHead(200, { 'content-type': TYPES[/** @type {keyof typeof TYPES} */ (extname(path))] ?? 'application/octet-stream' }).end(body);
	} catch {
		res.writeHead(404).end();
	}
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(undefined)));
const address = /** @type {import('node:net').AddressInfo} */ (server.address());
const origin = `http://127.0.0.1:${address.port}`;

/**
 * Talks to a tab over the DevTools protocol.
 *
 * @param {string} url The tab's debugger URL.
 * @returns {Promise<{ send: (method: string, params?: object) => Promise<any>, close: () => void }>} A sender.
 */
async function connect(url) {
	const ws = new WebSocket(url);
	await new Promise((resolve, reject) => {
		ws.onopen = resolve;
		ws.onerror = reject;
	});
	let id = 0;
	/** @type {Map<number, { resolve: (v: any) => void, reject: (e: Error) => void }>} */
	const pending = new Map();
	ws.onmessage = (e) => {
		const msg = JSON.parse(String(e.data));
		const p = pending.get(msg.id);
		if (!p) return;
		pending.delete(msg.id);
		if (msg.error) p.reject(new Error(msg.error.message));
		else p.resolve(msg.result);
	};
	return {
		send: (method, params = {}) =>
			new Promise((resolve, reject) => {
				pending.set(++id, { resolve, reject });
				ws.send(JSON.stringify({ id, method, params }));
			}),
		close: () => ws.close(),
	};
}

/** What runs in the page: every scene off screen and live, and the lazy lifecycle. */
const CHECK = async (/** @type {string} */ base, /** @type {boolean} */ sheet) => {
	const lib = await import(`${base}/src/index.js`);
	/** Light and shade in an image: mean and spread of its luma, and how much of it isn't near-black. */
	const stats = (/** @type {ImageData} */ img) => {
		let sum = 0;
		let sq = 0;
		let lit = 0;
		const n = img.data.length / 4;
		for (let i = 0; i < img.data.length; i += 4) {
			const l = (0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]) / 255;
			sum += l;
			sq += l * l;
			if (l > 0.03) lit++;
		}
		const mean = sum / n;
		return { mean: +mean.toFixed(3), spread: +Math.sqrt(Math.max(0, sq / n - mean * mean)).toFixed(3), lit: +(lit / n).toFixed(3) };
	};
	const pixels = async (/** @type {Blob | CanvasImageSource} */ src, /** @type {number} */ w, /** @type {number} */ h) => {
		const c = new OffscreenCanvas(w, h);
		const ctx = /** @type {OffscreenCanvasRenderingContext2D} */ (c.getContext('2d'));
		ctx.drawImage(src instanceof Blob ? await createImageBitmap(src) : src, 0, 0, w, h);
		return ctx.getImageData(0, 0, w, h);
	};
	const W = 200;
	const H = 250;
	const results = [];
	const shots = [];
	for (const name of Object.keys(lib.SCENES)) {
		const r = /** @type {any} */ ({ name });
		try {
			const t0 = performance.now();
			const blob = await lib.snapshot(name, {}, { width: W, height: H });
			r.ms = Math.round(performance.now() - t0);
			r.type = blob.type;
			r.snapshot = stats(await pixels(blob, W, H));
			shots.push(blob);
			// the same scene in another palette must look different
			const other = stats(await pixels(await lib.snapshot(name, { palette: { colors: ['#ff0bce', '#1bfefe', '#2d026e'], glint: '#ff00ff' } }, { width: W, height: H }), W, H));
			r.repaletted = other.mean !== r.snapshot.mean || other.spread !== r.snapshot.spread;
			// live, on a page canvas
			const canvas = document.createElement('canvas');
			canvas.style.cssText = 'display:block;width:200px;height:250px';
			document.body.append(canvas);
			const h = lib.scene(canvas, name, { lazy: false, scale: 1 });
			const drawn = h.frame(4);
			r.live = drawn ? stats(await pixels(drawn, W, H)) : null;
			h.stop();
			canvas.remove();
		} catch (error) {
			r.error = String(/** @type {Error} */ (error).message ?? error);
		}
		results.push(r);
	}

	// the lazy lifecycle on a real page: a context near the screen, given back on a fresh canvas after leaving it
	const lazy = /** @type {any} */ ({});
	{
		const box = document.createElement('div');
		box.style.cssText = 'position:absolute;left:0;top:0;width:200px;height:200px';
		document.body.append(box);
		const h = lib.scene(box, 'marble');
		const first = h.canvas;
		await new Promise((r) => setTimeout(r, 300));
		lazy.heldNear = first.hasAttribute('data-gl');
		const gl = /** @type {WebGL2RenderingContext} */ (first.getContext('webgl2'));
		box.style.top = '20000px';
		document.body.style.height = '30000px';
		await new Promise((r) => setTimeout(r, 4600));
		lazy.givenBack = gl.isContextLost();
		lazy.freshCanvas = h.canvas !== first && h.canvas.parentElement === box && !h.canvas.hasAttribute('data-gl');
		box.style.top = '0px';
		await new Promise((r) => setTimeout(r, 300));
		lazy.heldAgain = h.canvas.hasAttribute('data-gl');
		h.stop();
		lazy.removed = box.children.length === 0;
		box.remove();
	}

	let contact = null;
	if (sheet) {
		const cols = 6;
		const c = new OffscreenCanvas(cols * W, Math.ceil(shots.length / cols) * H);
		const ctx = /** @type {OffscreenCanvasRenderingContext2D} */ (c.getContext('2d'));
		for (const [i, blob] of shots.entries()) ctx.drawImage(await createImageBitmap(blob), (i % cols) * W, Math.floor(i / cols) * H);
		const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer());
		let bin = '';
		for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
		contact = btoa(bin);
	}
	const gl = /** @type {WebGL2RenderingContext} */ (document.createElement('canvas').getContext('webgl2'));
	const info = gl?.getExtension('WEBGL_debug_renderer_info');
	return { results, lazy, contact, renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) };
};

let failed = false;
const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(`${origin}/`)}`, { method: 'PUT' })).json();
const cdp = await connect(tab.webSocketDebuggerUrl);
try {
	await cdp.send('Runtime.enable');
	await new Promise((r) => setTimeout(r, 500));
	const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', { expression: `(${CHECK})(${JSON.stringify(origin)}, ${Boolean(out)})`, awaitPromise: true, returnByValue: true });
	if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
	const { results, lazy, contact, renderer } = result.value;
	console.log(`GPU: ${renderer}\n`);
	for (const r of results) {
		/** @param {any} s */
		const ok = (s) => s && s.spread > 0.015 && s.mean > 0.02 && s.mean < 0.98 && s.lit > 0.05;
		const pass = !r.error && r.type === 'image/png' && ok(r.snapshot) && ok(r.live) && r.repaletted;
		if (!pass) failed = true;
		console.log(`${pass ? 'ok  ' : 'FAIL'} ${r.name.padEnd(10)} ${r.error ?? `snapshot mean ${r.snapshot.mean} spread ${r.snapshot.spread} lit ${r.snapshot.lit} (${r.ms} ms) · live mean ${r.live?.mean} spread ${r.live?.spread} · repaletted ${r.repaletted}`}`);
	}
	const lifecycle = lazy.heldNear && lazy.givenBack && lazy.freshCanvas && lazy.heldAgain && lazy.removed;
	if (!lifecycle) failed = true;
	console.log(`\n${lifecycle ? 'ok  ' : 'FAIL'} lazy lifecycle ${JSON.stringify(lazy)}`);
	if (contact && out) {
		await writeFile(out, Buffer.from(contact, 'base64'));
		console.log(`\nContact sheet: ${out}`);
	}
} finally {
	cdp.close();
	await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`).catch(() => {});
	server.close();
}
process.exitCode = failed ? 1 : 0;
