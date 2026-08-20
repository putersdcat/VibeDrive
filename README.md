# VibeDrive

Cinematic GPS driving HUD. The engine and scenery follow your real speed — Tesla in-car GPS, or pedals / a local demo on a desk.

**Live demo:** [https://putersdcat.github.io/VibeDrive/](https://putersdcat.github.io/VibeDrive/)

This is an original recreation of the *GPS cabin HUD* idea popularized by [dribe.app](https://dribe.app). Names, audio, scenes, and artwork are new. Not affiliated.

## Cabin

- Nine scenes with cinematic sky plates and a dribe-style pseudo-3D road
- **Citrus Gator** is the boot scene — sunny I-95, gators on the tarmac, bananas / cukes / wieners raining onto the road. Gator hits play short public clips of Jeremy Judkins (with permission)
- Synthesized engine voices (V8, I6, EV inverter, muffled rain, space, synth)
- Direct drive by default (Tesla single-speed). ICE tributes still have a gearbox
- Speed from GPS, pin, cabin demo, or hold **Throttle** / Space
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

Priority: **pinned speed → GPS → local demo → pedals**.

No Tessie. No WebSocket. No VIN. No tokens.

In the Tesla in-car browser the cabin calls `navigator.geolocation.watchPosition({ enableHighAccuracy: true })` and reads `coords.speed` — the same path dribe.app uses. Pedals hide; the car drives the HUD.

On a phone or laptop: GPS if you allow it, otherwise **Throttle** / Space, pin speed, or **Cabin demo** (a local speed wave in this tab).

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

GPS, VIN, and tokens stay in the browser. Cabin hype MP3s are original synthesized lines plus short Jeremy Judkins reaction clips used with permission. Engine audio is synthesized with the Web Audio API.

## Develop

```bash
npm install
npm run dev
```

GitHub Pages publishes from **`main`**: `.github/workflows/pages.yml` runs `npm ci && npm run build` on every push to `main` (and on manual **workflow_dispatch**) and deploys `dist/` to the `gh-pages` branch.
