# @logomarks/shaders

WebGL 2 scene shaders: twenty full-frame backgrounds, each recoloured by a palette and shaped by a few named settings.

## Install

```bash
npm install @logomarks/shaders
```

## Quick start

```js
import { scene } from '@logomarks/shaders';

const h = scene(document.querySelector('canvas'), 'marble', {
  palette: { colors: ['#ff0bce', '#1bfefe', '#2d026e'], glint: '#ff00ff' },
  params: { scale: 1.2 },
});
h.set({ hue: 20 });
h.stop();
```

In Astro, use `<Scene>` from [`@arraypress/effects-astro`](https://github.com/arraypress/effects-astro).

## What's in it

- [API](https://github.com/Logomarks/shaders/blob/main/docs/api.md): `scene`, `snapshot`, `renderer`, `fallback`, every option, your own scenes, and the `/core`, `/load` and per-scene subpaths
- [Scenes](https://github.com/Logomarks/shaders/blob/main/docs/scenes.md): the twenty scenes, from `marble` to `melting-hologram`

## Links

- [Docs](https://github.com/Logomarks/shaders/tree/main/docs)
- [Changelog](https://github.com/Logomarks/shaders/blob/main/CHANGELOG.md)
- [Licence](https://github.com/Logomarks/shaders/blob/main/LICENSE)
- [GitHub](https://github.com/Logomarks/shaders)
- [`@arraypress/effects-astro`](https://github.com/arraypress/effects-astro), with the `PALETTES` any scene takes

## Licence

MIT © ArrayPress Limited; author David Sherlock.
