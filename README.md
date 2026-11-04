# @arraypress/shaders

WebGL 2 scene shaders: twenty full-frame backgrounds, each one fragment shader recoloured by a palette (three colours and a glint) and shaped by a few named settings. Plain JavaScript, no dependencies, no framework. Lazy contexts, a 30 fps cap, adaptive resolution and reduced motion are built in.

In Astro, use `<Scene>` from [`@arraypress/effects-astro`](https://github.com/arraypress/effects-astro).

## Install

```bash
npm install @arraypress/shaders
```

## Usage

```js
import { scene } from '@arraypress/shaders';

const h = scene(document.querySelector('canvas'), 'marble', {
  palette: { colors: ['#ff0bce', '#1bfefe', '#2d026e'], glint: '#ff00ff' },
  params: { scale: 1.2 },
});
h.set({ hue: 20 });
h.stop();
```

## API

| Export | |
|---|---|
| `scene(target, name, options)` | Runs a scene on a `<canvas>`, or in an element. Returns `{ canvas, set, settings, frame, play, pause, stop }`. |
| `snapshot(name, options, output)` | One still at an exact size, as an image `Blob` (1200×1200 PNG, 4 s in). |
| `renderer(name, options, size)` | Many frames on one context: `draw(t)`, `toBlob()`, `dispose()`. |
| `fallback(name, options)` | A still CSS background for before it draws and without WebGL 2. |
| `SCENES`, `PARAMS`, `LOOK_PARAMS` | Names, titles, descriptions and settings, for pickers and panels. |
| `resolveSettings`, `validateOptions`, `uniformValues` | The pure steps from options to uniforms. |
| `define`, `HEAD` | Your own scenes. |
| `@arraypress/shaders/core` | The engine without any shader; takes definitions. |
| `@arraypress/shaders/<name>` | One scene's definition. |
| `@arraypress/shaders/load` | `load(name)`: one scene, as its own chunk. |

Options: `palette`, `colors`, `glint`, `params`, `speed`, `hue`, `sat`, `exposure`, `tint`, `tintAmount`, `zoom`, `angle`, `grain`, `fps`, `scale`, `minScale`, `lazy`, `pointer`. Each is documented in `src/types.d.ts`; bad ones throw.

## Scenes

| Name | |
|---|---|
| `marble` | A flowing glassy liquid reflecting big panels of colour |
| `frosted` | Fluted glass bending soft orbs of colour |
| `ribs` | Fine stripes of light through ribbed glass |
| `tiles` | Ray-marched rounded tiles of glossy metal |
| `blob` | A soft iridescent glass blob on a pale ground |
| `chrome` | Metal blobs merging in a studio, rippled by the pointer |
| `glitter` | A marbled nebula with dense glitter and flaring stars |
| `foil` | Rainbow foil that shifts as the pointer tilts it |
| `ribbon` | A sheet of clear glass curving through black |
| `spiral` | Fine grooves sweeping round a turning disc |
| `swirl` | A glass shell with silk strands of thin-film colour |
| `arches` | Nested rounded arches, each lit at its rim |
| `spheres` | Matte spheres at different depths |
| `spheres2` | Fewer, bigger, nearer spheres, in pinker light |
| `strands` | Ribbons of black glass with sliding highlights |
| `rings` | Concentric glass arcs, warm and cold |
| `ink-water` | Ink clouds blooming through a pale tank |
| `topo` | Contour lines of shifting ground |
| `oil-bubbles` | Glassy bubbles drifting and merging on marbled ink |
| `melting-hologram` | Iridescent liquid folding over black |

Each scene's colours and settings are described at the top of `src/scenes/<name>.js`.

## Links

- [Changelog](CHANGELOG.md)
- [`@arraypress/effects-astro`](https://github.com/arraypress/effects-astro), with the `PALETTES` any scene takes
- [Issues](https://github.com/arraypress/shaders/issues)

MIT
