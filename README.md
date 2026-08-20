# VibeDrive

Cinematic GPS driving HUD. The engine, scenery, and cabin radio follow your real speed — or a simulated throttle if you are parked.

**Live demo:** [https://putersdcat.github.io/VibeDrive/](https://putersdcat.github.io/VibeDrive/)

This is an original recreation of the *GPS cabin HUD* idea popularized by [dribe.app](https://dribe.app). Names, audio, scenes, and artwork are new. Not affiliated.

## Cabin

- Eight scenes (Forge V8, Signal Bloom, White Pass, Copper Wash, Tape Rain, Inverter, Halo Drift, Paper Lantern)
- Synthesized engine voices (V8, I6, EV inverter, muffled rain, space, synth)
- Auto / manual gearbox on scenes that support it
- Procedural lo-fi cabin radio
- GPS live speed, or hold **Throttle** / Space
- km/h or mph, dark / light / auto theme

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

## Privacy

GPS is read in the browser only. Coordinates are never uploaded. Engine and music are synthesized with the Web Audio API — no audio CDN.

## Develop

```bash
npm install
npm run dev
```

GitHub Pages is published from `main` by `.github/workflows/pages.yml` (`npm ci && npm run build` → `actions/deploy-pages`).
