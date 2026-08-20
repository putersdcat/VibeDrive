# VibeDrive

Cinematic GPS driving HUD. The engine and scenery follow your real speed — Tesla in-car GPS, or pedals on a desk.

**Live demo:** [https://putersdcat.github.io/VibeDrive/](https://putersdcat.github.io/VibeDrive/)

This is an original recreation of the *GPS cabin HUD* idea popularized by [dribe.app](https://dribe.app). Names, audio, scenes, and artwork are new. Not affiliated.

## Cabin

- Four scenes with cinematic sky plates and a dribe-style pseudo-3D road
- **Citrus Gator** is the boot scene — sunny I-95, gators on the tarmac, bananas / cukes / wieners raining onto the road. Gator hits play short public clips of Jeremy Judkins (with permission)
- **Copper Wash**, **White Pass**, and **Paper Lantern** use the same road math with their own skies and roadside sprites
- Synthesized engine voices
- Direct drive by default (Tesla single-speed). ICE tributes still have a gearbox
- On a desk, **Throttle / Brake** drive the cabin. In a Tesla browser, GPS does
- km/h or mph, dark / light / auto theme
- WebGL2 road + Rust WASM particle core (Canvas 2D fallback)

### Keys

| Key | Action |
| --- | --- |
| Space / W / ↑ | Throttle |
| S / ↓ | Brake |
| A / [ | Downshift |
| Z / Q / ] | Upshift |
| 1–4 | Scenes |
| M | Mute |
| D | Toggle scene dock |

## How speed gets into the cabin

**Desk:** pedals (or pin / local demo). **Tesla browser:** GPS. Pedals hide in the car unless you flip “Use pedals instead of GPS”.

No Tessie. No WebSocket. No VIN. No tokens.

In the Tesla in-car browser the cabin calls `navigator.geolocation.watchPosition({ enableHighAccuracy: true })` and reads `coords.speed` — the same path dribe.app uses.

## Run

```bash
npm ci
npm run dev
```

GitHub Pages deploys from `main` via `.github/workflows/pages.yml`.
