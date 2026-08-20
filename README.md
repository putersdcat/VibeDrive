# VibeDrive

Cinematic GPS driving HUD. The engine, scenery, and cabin radio follow your real speed — from the phone GPS, a Tesla stream, or a simulated throttle.

**Live demo:** [https://putersdcat.github.io/VibeDrive/](https://putersdcat.github.io/VibeDrive/)

This is an original recreation of the *GPS cabin HUD* idea popularized by [dribe.app](https://dribe.app). Names, audio, scenes, and artwork are new. Not affiliated.

## Cabin

- Eight scenes (Forge V8, Signal Bloom, White Pass, Copper Wash, Tape Rain, Inverter, Halo Drift, Paper Lantern)
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
| 1–8 | Scenes |
| M | Mute |
| D | Toggle scene dock |

## How speed gets into the cabin

Priority: **pinned speed → Tesla (if live) → GPS (if not simulating) → throttle sim**.

### Tesla

Official Tesla **Fleet Telemetry** (`VehicleSpeed`, miles/hour) is a vehicle-to-*your-server* stream. A GitHub Pages site has no server and cannot call Tesla REST (CORS). The cabin therefore never talks to Tesla directly.

Viable static-host paths:

| Source | What it is | Token location |
| --- | --- | --- |
| **Tessie** | Browser WebSocket `wss://streaming.tessie.com/{VIN}?access_token=…` | localStorage |
| **Custom `wss://`** | Your TeslaMate / Fleet Telemetry forwarder that emits JSON with `VehicleSpeed` / `drive_state.speed` | localStorage |
| **Demo** | Local Tesla-shaped speed wave, no account | none |
| **GPS** | Phone in the car, `Geolocation.coords.speed` | none |

VIN and Tessie token never leave this tab. Open **Settings → Tesla telemetry**.

A custom forwarder can send either JSON (`{ "VehicleSpeed": 41.2 }` or Fleet-style `{ "data": [{ "key": "VehicleSpeed", "value": { "doubleValue": 41.2 } }] }`) or a raw number. Tesla/Tessie streams are mph; the custom URL has a unit toggle.

### GPS

Works parked-in-car with the phone on the dash. GitHub Pages is HTTPS, so the browser will grant geolocation. Turn **Prefer simulation** off.

## High FPS road

The cabin prefers **WebGL2**: a fullscreen warp shader for sky/road/buildings plus a **Rust `cdylib`** (~8 KB) that ticks 2048 particles (snow, rain, dust, lanterns, stars) through a C ABI. No allocator in the tick path. If WebGL2 is missing, Canvas 2D takes over.

Rebuild the WASM (optional — `public/vibedrive_core.wasm` is already committed):

```bash
rustup target add wasm32-unknown-unknown
cd rust
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/vibedrive_core.wasm ../public/
```

## Privacy

GPS, VIN, and tokens stay in the browser. Coordinates are never uploaded. Engine and music are synthesized with the Web Audio API — no audio CDN.

## Develop

```bash
npm install
npm run dev
```

GitHub Pages is published from `main` by `.github/workflows/pages.yml` (`npm ci && npm run build` → `gh-pages` branch).
