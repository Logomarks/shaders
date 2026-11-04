# Changelog

All notable changes to `@arraypress/shaders` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — Unreleased

### Added

- **`oil-bubbles`**: clear glassy bubbles of many sizes on marbled ink (oil on water, macro). The ink is two colours pulled into swirls with fine streaks along them; the bubbles refract it, reflect a room (a window, a strip light, the light off the water) by Fresnel, and drift, touch, neck and merge, with a wall where two meet and tiny satellite bubbles round their rims. Settings: `count`, `size`, `flow`, `scale`, `ground` (0 a pale ground, 1 a dark one) and `refraction`. Colours: the two inks, the ground, and the light.
- **`melting-hologram`**: an iridescent liquid on black. Thin-film colour (the three colours looped into a spectrum) slides across smooth melted folds that reflect a dark studio, so the colour comes in bands with black between and the edges run white where they turn away; a few glass bubbles rise through it, bending the liquid behind them. Settings: `scale`, `flow`, `iridescence`, `sharpness` and `bubbles`.

### Changed

- **The engine is split into small modules** in `src/runtime/` (look, colour, options, uniforms, GL, device, frame loop, pointer, lazy context, scene, renderer, snapshot, fallback), each with its own `.d.ts`; `src/core.js` gathers them. The shared types are in `src/types.d.ts`. The API, the subpath exports and every scene's pixels are unchanged.
- **The shader head is put together from `src/glsl/`** (uniforms, palette, space, noise, shapes, studio, finish). `soft()` (three-octave noise) and `sdRoundRect()` moved into it from the scenes that each had their own copy.
- **The README is cut to the essentials**; the detail lives in each module's docblock.

## [0.1.0] — 2026-11-04

### Added

- **Eighteen scenes**, extracted from the Logomarks site's scenes lab with their shaders unchanged: `marble`, `frosted`, `ribs`, `tiles`, `blob`, `chrome`, `glitter`, `foil`, `ribbon`, `spiral`, `swirl`, `arches`, `spheres`, `spheres2`, `strands`, `rings`, `ink-water` and `topo`. Each scene takes three colours and a glint (a palette in `@arraypress/effects-astro`'s shape) and has up to six named settings with labels, ranges and defaults.
- **`scene(target, name, options)`** runs a scene on a canvas, or in an element where it makes its own canvas. It returns `{ canvas, set, settings, frame, play, pause, stop }`. `frame(t)` pauses the scene and draws the frame `t` seconds in.
- **The runner keeps every performance behaviour from the site.** It holds a lazy WebGL context only while the scene is near the screen and gives it back 4 s after it leaves, putting a fresh canvas in place each time. It caps the frame rate (30 fps), draws at a resolution scale that steps down when frames come late, starts lower on weak devices, draws one still frame with reduced motion, and pauses while off screen or the tab is hidden. It follows the pointer over the canvas's area.
- **`snapshot(name, options, { width, height, t })`** renders a still off screen, at an exact size, as an image `Blob` (PNG by default). **`renderer()`** draws a sequence of frames on one context and one compile, for video.
- **`SCENES`**, **`PARAMS`** and **`LOOK_PARAMS`** give the names, descriptions and settings for building UIs. **`fallback()`** returns a still CSS background for each scene.
- **Per-scene modules** (`@arraypress/shaders/marble`, …), **`@arraypress/shaders/core`** (the engine, without any shader) and **`@arraypress/shaders/load`** (loads a scene by name, each in its own chunk), so a page ships only the scenes it uses.
- **`define()`** and **`HEAD`**, for writing your own scenes. **`resolveSettings`**, **`validateOptions`** and **`uniformValues`** are the pure steps from options to uniforms.
