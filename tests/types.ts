// Type-level usage check (`npm run typecheck`); never executed.
import { scene, snapshot, renderer, SCENES, PARAMS, LOOK_PARAMS, definition, fallback, define, HEAD, type SceneName, type SceneOptions, type SceneHandle } from '../src/index.js';
import { scene as run } from '../src/core.js';
import { load, NAMES } from '../src/load.js';
import marble from '../src/scenes/marble.js';
import { inkWater } from '../src/scenes/ink-water.js';

declare const canvas: HTMLCanvasElement;
declare const div: HTMLDivElement;

const barbie = { colors: ['#ff0bce', '#1bfefe', '#2d026e'] as [string, string, string], glint: '#ff00ff' };
const options: SceneOptions = { palette: barbie, params: { scale: 1.2 }, speed: 0.8, hue: 10, sat: 1.1, exposure: 1, zoom: 1.2, angle: 15, grain: 0.5, fps: 24, scale: 0.6, lazy: '300px', pointer: div };
const h: SceneHandle = scene(canvas, 'marble', options);
h.set({ colors: ['#000'], glint: '#fff' });
const still: HTMLCanvasElement | null = h.frame(2.5);
h.canvas.toBlob(() => {});
h.pause();
h.play();
h.stop();
const settings = h.settings();
scene(div, marble, settings);
run(canvas, inkWater, { lazy: false });

const png: Promise<Blob> = snapshot('ink-water', { palette: barbie }, { width: 1080, height: 1920, t: 3 });
const r = renderer('topo', {}, { width: 640, height: 640 });
r.draw(1, [0.5, 0.5]);
void r.toBlob({ type: 'image/webp', quality: 0.9 }).then(() => r.dispose());

const names: SceneName[] = Object.keys(SCENES) as SceneName[];
for (const n of names) for (const p of PARAMS[n]) console.log(SCENES[n].title, p.key, p.min, p.max, p.step, p.default);
for (const p of LOOK_PARAMS) console.log(p.label);
void load(NAMES[0]).then((def) => scene(canvas, def));
console.log(definition('marble').fragment, fallback('blob', options), still, png);

define({ name: 'plain', title: 'Plain', description: 'A plain colour.', scale: 0.5, ground: '#000000', look: { colors: ['#111111', '#222222', '#333333'], glint: '#ffffff' }, params: [], fragment: `${HEAD}void main() { o = vec4(uC1, 1.0); }` });

// @ts-expect-error: a palette is data, not a name
scene(canvas, 'marble', { palette: 'Barbie' });
// @ts-expect-error: not a scene
scene(canvas, 'crt');
