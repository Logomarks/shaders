# Changelog

All notable changes to `@arraypress/shaders` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-11-04

### Added

- **Eighteen scenes**, extracted from the Logomarks site's scenes lab with their shaders unchanged: `marble`, `frosted`, `ribs`, `tiles`, `blob`, `chrome`, `glitter`, `foil`, `ribbon`, `spiral`, `swirl`, `arches`, `spheres`, `spheres2`, `strands`, `rings`, `ink-water` and `topo`. Each scene takes three colours and a glint (a palette in `@arraypress/effects-astro`'s shape) and has up to six named settings with labels, ranges and defaults.
- **`scene(target, name, options)`** runs a scene on a canvas, or in an element where it makes its own canvas. It returns `{ canvas, set, settings, frame, play, pause, stop }`. `frame(t)` pauses the scene and draws the frame `t` seconds in.
- **The runner keeps every performance behaviour from the site.** It holds a lazy WebGL context only while the scene is near the screen and gives it back 4 s after it leaves, putting a fresh canvas in place each time. It caps the frame rate (30 fps), draws at a resolution scale that steps down when frames come late, starts lower on weak devices, draws one still frame with reduced motion, and pauses while off screen or the tab is hidden. It follows the pointer over the canvas's area.
- **`snapshot(name, options, { width, height, t })`** renders a still off screen, at an exact size, as an image `Blob` (PNG by default). **`renderer()`** draws a sequence of frames on one context and one compile, for video.
- **`SCENES`**, **`PARAMS`** and **`LOOK_PARAMS`** give the names, descriptions and settings for building UIs. **`fallback()`** returns a still CSS background for each scene.
- **Per-scene modules** (`@arraypress/shaders/marble`, …), **`@arraypress/shaders/core`** (the engine, without any shader) and **`@arraypress/shaders/load`** (loads a scene by name, each in its own chunk), so a page ships only the scenes it uses.
- **`define()`** and **`HEAD`**, for writing your own scenes. **`resolveSettings`**, **`validateOptions`** and **`uniformValues`** are the pure steps from options to uniforms.
