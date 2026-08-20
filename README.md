# VibeDrive

Cinematic GPS driving HUD. The engine, scenery, and cabin radio follow your real speed — from the phone GPS, a Tesla stream, or a simulated throttle.

**Live demo:** [https://putersdcat.github.io/VibeDrive/](https://putersdcat.github.io/VibeDrive/)

This is an original recreation of the *GPS cabin HUD* idea popularized by [dribe.app](https://dribe.app). Names, audio, scenes, and artwork are new. Not affiliated.

## Cabin

- Ten scenes, including Tesla-garage tributes **Citrus Gator** (Florida sun, gators, banana / cucumber / hot-dog rain) and **Xing Ghost** (grade crossing + cyan vision boxes)
- Original cabin-hype shout-outs (`Jesus!`, `Oh my!`, …) — synthesized, **not** a real person's voice
- Synthesized engine voices (V8, I6, EV inverter, muffled rain, space, synth)
- Auto / manual gearbox on scenes that support it
- Procedural lo-fi cabin radio
- Speed from GPS, Tesla telemetry, pin, or hold **Throttle** / Space
- km/h or mph, dark / light / auto theme
- WebGL2 road + Rust WASM particle core (Canvas 2D fallback)

### Keys

| Key | Action |
| --- | --- |
| Space / W / ↑ | Throttle |
| S / ↓ | Brake |
| A / [ | Downshift |
| Z / Q / ] | Upshift |
| 1–9, 0 | Scenes |
| M | Mute |
| D | Toggle scene dock |

## How speed gets into the cabin

Priority: **pinned speed → GPS → optional Tessie stream → pedals**.

### Tesla in-car browser (the dribe.app path)

dribe.app does **not** talk to Tessie or Tesla Fleet. It calls `navigator.geolocation.watchPosition({ enableHighAccuracy: true })` and reads `coords.speed`. Tesla's QtWebEngine browser exposes the vehicle GPS that way. Open VibeDrive in the car browser, tap ignite, allow location if asked. Pedals hide; the cabin follows the car.

A web page cannot request Tesla telemetry just because it is running in the car. There is no in-browser vehicle API.

### Optional extras (phone / laptop)

| Source | What it is |
| --- | --- |
| **GPS** | Same Geolocation API on a phone |
| **Tessie** | `wss://streaming.tessie.com/{VIN}?access_token=…` if you already pay for Tessie |
| **Custom `wss://`** | Your TeslaMate / Fleet forwarder |
| **Pedals / pin** | Desk preview |

VIN and Tessie token never leave this tab.

## High FPS road

The cabin prefers **WebGL2**: a fullscreen warp shader plus a **Rust `cdylib`** (~8 KB) that ticks 2048 particles. If WebGL2 is missing, Canvas 2D takes over.

Rebuild the WASM (optional — `public/vibedrive_core.wasm` is already committed):

```bash
rustup target add wasm32-unknown-unknown
cd rust
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/vibedrive_core.wasm ../public/
```

## Privacy

GPS, VIN, and tokens stay in the browser. Cabin hype MP3s are original synthesized lines. Engine and music are synthesized with the Web Audio API.

## Develop

```bash
npm install
npm run dev
```

GitHub Pages is published from `main` by `.github/workflows/pages.yml` (`npm ci && npm run build` → `gh-pages` branch).
