# @arraypress/shaders

WebGL 2 scene shaders: twenty full-frame backgrounds (liquid marble, frosted glass, glossy tiles, chrome, glitter, holographic foil, ink in water, oil bubbles, a melting hologram and more). Each one is a single fragment shader that takes its colours from a palette (three colours and a glint) and its shape from a few named settings, so one scene can be made into many looks.

It's plain JavaScript with no dependencies and no framework, so it runs in a plain HTML page, Astro, React, Svelte or Vue. Running scenes are cheap by default: a WebGL context is held only while the scene is near the screen, frames are capped at 30 a second, resolution adapts to the device, and reduced motion is respected. It can also render stills off screen as PNGs, for covers and mockups.

```js
import { scene } from '@arraypress/shaders';

scene(document.querySelector('canvas'), 'marble', {
  palette: { colors: ['#ff0bce', '#1bfefe', '#2d026e'], glint: '#ff00ff' },
  params: { scale: 1.2 },
});
```

In Astro, use `<Scene>` from [`@arraypress/effects-astro`](https://github.com/arraypress/effects-astro), which wraps this package.

## Install

```bash
npm install @arraypress/shaders
```

## The scenes

| Name | | Settings (`params`) |
|---|---|---|
| `marble` | Liquid marble: a flowing glassy liquid reflecting big panels of colour, with sharp highlights and dark creases where it folds | `scale`, `sharpness`, `warp`, `relief` |
| `frosted` | Frosted glass: fluted glass bending soft orbs of colour that drift behind it | `flutes`, `depth`, `frost`, `dispersion`, `roundness` |
| `ribs` | Ribbed light: fine stripes of light through ribbed glass, bent by big slow folds and lit in patches | `ribs`, `bend`, `patches`, `depth`, `dispersion` |
| `tiles` | Glossy tiles: ray-marched rounded tiles of glossy metal, with lit bevels and black gaps | `size`, `gap`, `roundness`, `bevel`, `height`, `turn` |
| `blob` | Pastel blob: a soft iridescent glass blob on a pale ground, budding and merging as it morphs | `count`, `size`, `buds`, `wander` |
| `chrome` | Chrome liquid: metal blobs merging in a studio; the pointer is one more, and ripples them | `count`, `size`, `wander`, `ripple` |
| `glitter` | Glitter galaxy: a marbled nebula with dense glitter and flaring stars, cutting between the three colours like a video | `glitter`, `sparkles`, `stars`, `cuts`, `scale` |
| `foil` | Holographic foil: rainbow foil, diffraction lines and glitter that shift as the pointer tilts it | `lines`, `bands`, `warp`, `glitter`, `sheen` |
| `ribbon` | Neon ribbon: a thick sheet of clear glass curving through black, its edges split into colour | `field`, `thickness`, `sheets`, `bend`, `fringe` |
| `spiral` | Spiral trails: fine grooves sweeping round a slowly turning disc | `grooves`, `depth`, `streaks`, `patch` |
| `swirl` | Glass swirl: a glass shell with a dark core, with silk strands of thin-film colour round its rim | `strands`, `size`, `core`, `flow`, `glow` |
| `arches` | Arches: nested rounded arches stepping out from a corner, each lit at its rim | `steps`, `spread`, `width`, `roundness`, `rim` |
| `spheres` | Pastel spheres: matte spheres floating at different depths, the far ones out of focus | `count`, `size`, `focus`, `blur`, `drift` |
| `spheres2` | Pastel spheres, close: fewer, bigger, nearer spheres, in pinker light | `count`, `size`, `focus`, `blur`, `drift` |
| `strands` | Glass strands: ribbons of black glass, with sharp highlights sliding along them | `count`, `width`, `spread`, `bend` |
| `rings` | Glass rings: concentric glass arcs rippling outward, warm on one side and cold on the other | `rings`, `wobble`, `glints`, `brush` |
| `ink-water` | Ink in water: ink clouds blooming and curling through a pale tank | `amount`, `curl`, `scale`, `softness` |
| `topo` | Topographic: contour lines of slowly shifting ground | `lines`, `every`, `scale`, `detail` |
| `oil-bubbles` | Oil bubbles: clear glassy bubbles of many sizes on marbled ink, bending the swirls through them; they drift, touch, merge and part. On a pale ground or (with `ground` at 1) a dark one | `count`, `size`, `flow`, `scale`, `ground`, `refraction` |
| `melting-hologram` | Melting hologram: an iridescent liquid flowing and folding over black, thin-film colour sliding across its melted folds, with now and then a glassy bubble | `scale`, `flow`, `iridescence`, `sharpness`, `bubbles` |

Each scene starts with its own colours. What each colour does in a scene (for example, "c1 the hot panel, c2 the deep panel…") is written at the top of its module, `src/scenes/<name>.js`.

## Usage

### `scene(target, name, options)`

This runs a scene and returns a handle for controlling it. `target` is either a `<canvas>` or an element to draw in. If you pass an element, a canvas is created inside it and fills it. Use an element in React, Svelte or Vue, because those frameworks own their DOM and a lazy scene replaces its canvas (see [Performance](#performance)).

```js
const h = scene(canvas, 'ink-water', { palette: PALETTES.Barbie, speed: 0.6 });

h.set({ params: { curl: 4 }, hue: 20 }); // changes show at once, even on a still scene
h.settings();                            // its settings now, in the shape options take
h.frame(2.5);                            // pause, and draw the frame 2.5 s in
h.play();
h.pause();
h.stop();                                // no frames, no listeners, context given back
h.canvas;                                // the canvas it draws on now
```

React:

```jsx
function Hero() {
  const ref = useRef(null);
  useEffect(() => {
    const h = scene(ref.current, 'marble', { palette });
    return () => h.stop();
  }, []);
  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />;
}
```

Svelte: `onMount(() => { const h = scene(el, 'marble'); return () => h.stop(); })`, where `el` is a `<div>` you bind.

### Options

| Option | Default | |
|---|---|---|
| `palette` | the scene's | `{ colors: [3 hex], glint }`, in the shape of `@arraypress/effects-astro`'s `PALETTES` (see [Palettes](#palettes)) |
| `colors` | | One to three hex colours. They replace the palette's colours in order. |
| `glint` | | A highlight colour (hex), used instead of the palette's glint |
| `params` | the scene's | The scene's own settings by key (`PARAMS[name]`). Any you leave out keep their default. |
| `speed` | 1 | 0 is still, 3 is fast |
| `hue` | 0 | Degrees round the colour wheel |
| `sat` | 1 | 0 is grey, 2 is doubled |
| `exposure` | 1 | Brightness, from 0.3 to 2 |
| `tint`, `tintAmount` | `#d4ff3a`, 0 | A colour to lean the picture toward, keeping its light and dark |
| `zoom` | 1 | Must be more than 0 |
| `angle` | 0 | Degrees |
| `grain` | 1 | Film grain, from 0 to 3. Some scenes start lower. |
| `fps` | 30 | Frames a second |
| `scale` | the scene's | The share of CSS pixels to draw at, (0, 1] |
| `minScale` | 0.3 | The lowest share it drops to while frames come late |
| `lazy` | `true` | Holds a context only while the scene is near the screen. Pass a CSS length for how near (`'200px'` by default), or `false` to hold one from the start. |
| `pointer` | `true` | Follows the pointer over the canvas's area, whatever is on top of it. Pass an element to listen on that element instead, or `false` to ignore the pointer. |

Bad options throw immediately. Unknown keys, colours that aren't hex, a param the scene doesn't have, or numbers that aren't finite throw a `TypeError`. An out-of-range `fps`, `zoom` or `scale` throws a `RangeError`. An option set to `undefined` counts as not given.

### `SCENES`, `PARAMS`, `LOOK_PARAMS`

These are for building pickers and settings panels:

```js
import { SCENES, PARAMS, LOOK_PARAMS } from '@arraypress/shaders';

SCENES.marble;      // { name: 'marble', title: 'Liquid marble', description: '…' }
PARAMS.marble;      // [{ key: 'scale', label: 'Scale', min: 0.4, max: 2.5, step: 0.02, default: 1.1 }, …]
LOOK_PARAMS;        // speed, hue, sat, exposure, tintAmount, zoom, angle, grain, in the same shape
```

### Stills and frames

`snapshot(name, options, { width, height, t, type, quality })` renders one frame off screen (on an `OffscreenCanvas`) at an exact size and resolves to an image `Blob`. The default is a 1200×1200 PNG, 4 seconds in. Use it for covers, mockups, or anywhere the scene should be a picture.

```js
const png = await snapshot('marble', { palette: PALETTES.Ember }, { width: 1080, height: 1350 });
img.src = URL.createObjectURL(png);
```

For a sequence of frames (video, a Spotify Canvas), `renderer(name, options, { width, height })` uses one context and one compile for every frame:

```js
const r = renderer('ink-water', { palette }, { width: 720, height: 1280 });
for (let i = 0; i < 240; i++) {
  r.draw(i / 30);                                  // frame i of 8 s at 30 fps
  frames.push(await r.toBlob());
}
r.dispose();
```

Times are seconds at the scene's `speed`, so `t` is the frame the running scene shows `t` seconds in. A live handle's `frame(t)` draws on the page's canvas at its on-screen size. Read that canvas in the same task, before the browser clears it.

### Fallback

`fallback(name, options)` returns a still CSS `background`: the scene's three colours as soft blooms over its ground. Put it behind the canvas so something shows before the scene draws, and wherever there is no WebGL 2.

## Palettes

A palette is `{ colors: [three hex], glint }`. That's the shape of the eighteen named `PALETTES` in `@arraypress/effects-astro` (Lumetri, Forest, Cadmium, Peacock, Vermillion, Barbie, Uranium, Azure, Ruby, Ultramarine, Saffron, Crimson, Ember, Lagoon, Citrus, Glacier, Rosewater, Mono), so any of them can be passed in as they are:

```js
import { PALETTES } from '@arraypress/effects-astro';
scene(canvas, 'marble', { palette: PALETTES.Barbie });
```

This package takes palettes as data instead of importing them, because effects-astro depends on this package and importing back would make a cycle. Pass the palette object itself, not its name. `<Scene palette="Barbie">` in effects-astro resolves the name for you.

Each scene brings its palette colours to the part they play (for example, lifting a colour that is too dark to be a highlight), so any palette reads well in any scene.

## Performance

A running scene costs only what it needs to:

- **Lazy WebGL context.** A scene makes its context when it comes within 200px of the screen and gives it back 4 s after it leaves. A browser keeps about sixteen contexts and drops the oldest past that, so a page with many scenes has to give them back. A canvas whose context was given back can't get another one, so a fresh canvas replaces it in the DOM each time (`handle.canvas` is always the current one). The canvas holding a context has a `data-gl` attribute.
- **Draws only when seen.** No frames are drawn while the scene is off screen or the tab is hidden.
- **Frame cap.** It draws at `fps` (30 by default), not at the screen's 60 or 120.
- **Resolution.** It draws at the scene's `scale` (0.45 to 0.85 of CSS pixels) and never above one device pixel per CSS pixel. These are soft pictures, and the browser scales them up without visible loss. Weak devices (four cores or fewer, 4 GB of memory or less, or data saver on) start at three quarters of that. When frames come late, the resolution steps down to `minScale`.
- **Reduced motion.** With `prefers-reduced-motion`, it draws one frame (4 s in) and stops.

`stop()` frees the context right away, unless the canvas is still on the page and was passed in by you. In that case the context is kept, so another scene can reuse the canvas (React's strict mode mounts twice).

## Shipping only the scenes you use

The index (`@arraypress/shaders`) includes all twenty shaders. To ship fewer, import each scene from its own module and run it with the core, which contains no shaders:

```js
import { scene, snapshot } from '@arraypress/shaders/core';
import marble from '@arraypress/shaders/marble';

scene(canvas, marble, { palette });
```

If the scene's name is only known at run time (from a CMS field or a prop), `load(name)` from `@arraypress/shaders/load` imports that one scene as its own chunk:

```js
import { scene } from '@arraypress/shaders/core';
import { load } from '@arraypress/shaders/load';

scene(canvas, await load(el.dataset.scene), options);
```

Every function in the core takes a scene definition. The index versions also accept a name.

## Your own scenes

A scene is plain data. `define()` checks it and freezes it, and it then runs like any built-in scene:

```js
import { define, HEAD } from '@arraypress/shaders/core';

export const plain = define({
  name: 'plain',
  title: 'Plain',
  description: 'The first colour, breathing.',
  scale: 0.5,
  ground: '#000000',
  look: { colors: ['#ff5c2e', '#14477a', '#eb4d8c'], glint: '#ffffff' },
  params: [{ key: 'pulse', label: 'Pulse', min: 0, max: 1, step: 0.01, default: 0.3 }],
  fragment: `${HEAD}
void main() {
  vec3 c = uC1 * (1.0 - uP[0] * 0.5 * (1.0 + sin(uTime)));
  o = vec4(finish(c, gl_FragCoord.xy), 1.0);
}`,
});
```

`HEAD` declares the uniforms: `uRes`, `uTime`, `uMouse` (0 to 1 from the bottom left), the look (`uHue`, `uSat`, `uExposure`, `uTint`, `uTintAmt`, `uZoom`, `uAngle`, `uGrain`), the palette (`uC1` to `uC3`, and `uC4` for the glint) and `uP[6]` (the params, in order). It also provides the helpers: `sceneUv()` (the pixel's position, centred, with zoom and angle applied), `finish()` (applies the look, a vignette and grain), `lift`, `lower`, `vivid`, `hueTurn` and `loop3` (bring a palette colour to the part it plays), `noise`, `fbm`, `rot` and `glassRoom()` (a studio for glass to reflect).

`resolveSettings`, `validateOptions` and `uniformValues` are the pure steps from options to uniforms, if you need them separately.

## Development

```bash
npm test              # node --test: options, palettes, params, the registry, every shader parsed as GLSL ES 3.00, the runner's lifecycle against a pretend browser
npm run typecheck     # the .d.ts files, against tests/types.ts
npm run test:browser  # every scene compiled and drawn on a real GPU in Chrome (remote debugging on 9334, or CHROME_PORT); --out sheet.png writes a contact sheet
```

## Licence

MIT
