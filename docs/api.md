# API

Plain JavaScript, no dependencies, no framework. Lazy contexts (one is held only while a scene is near the viewport), a 30 fps cap, adaptive resolution and reduced motion are built in.

| Export | |
|---|---|
| `scene(target, name, options)` | Runs a scene on a `<canvas>`, or in an element. Returns `{ canvas, set, settings, frame, play, pause, stop }`. |
| `snapshot(name, options, output)` | One still at an exact size, as an image `Blob` (1200×1200 PNG, 4 s in). |
| `renderer(name, options, size)` | Many frames on one context: `draw(t)`, `toBlob()`, `dispose()`. |
| `fallback(name, options)` | A still CSS background for before it draws and without WebGL 2. |
| `SCENES`, `PARAMS`, `LOOK_PARAMS` | Names, titles, descriptions and settings, for pickers and panels. |
| `resolveSettings`, `validateOptions`, `uniformValues` | The pure steps from options to uniforms. |
| `define`, `HEAD` | Your own scenes. |
| `@logomarks/shaders/core` | The engine without any shader; takes definitions. |
| `@logomarks/shaders/<name>` | One scene's definition. |
| `@logomarks/shaders/load` | `load(name)`: one scene, as its own chunk. |

Options: `palette`, `colors`, `glint`, `params`, `speed`, `hue`, `sat`, `exposure`, `tint`, `tintAmount`, `zoom`, `angle`, `grain`, `fps`, `scale`, `minScale`, `lazy`, `pointer`. Each is documented in [`src/types.d.ts`](../src/types.d.ts); bad ones throw. A palette is data (`{ colors, glint }`), such as `PALETTES.Barbie` from [`@arraypress/effects-astro`](https://github.com/arraypress/effects-astro).

`set(options)` on a running scene takes the same options, except `lazy` and `pointer`, which are fixed when it starts.
