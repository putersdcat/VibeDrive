import type { HypeLine } from "../callouts";
import { assetRoot, loadImageAsset } from "../assets";
import { CAM_H, HORIZON, ROAD_H, WORLD_SPEED, project } from "../camera";
import type { SceneKind } from "../types";

const PRODUCE: Record<0 | 1 | 2, [string, string, string]> = {
  0: ["banana-0", "banana-1", "banana-2"],
  1: ["cucumber-0", "cucumber-1", "cucumber-2"],
  2: ["hotdog-0", "hotdog-1", "hotdog-2"],
};
const CLOUD_NAMES = ["cloud-0", "cloud-1", "cloud-2"] as const;

type KindFx = {
  props: string[];
  propH: number;
  roadside: number;
  count: number;
  clouds: boolean;
  cloudAlpha: number;
  weather: "produce" | "petals" | "snow" | "dust" | null;
  gators: boolean;
};

const FX: Partial<Record<SceneKind, KindFx>> = {
  florida: {
    props: ["palm-0", "palm-1", "palm-2"],
    propH: 1.62,
    roadside: 0.95,
    count: 8,
    clouds: true,
    cloudAlpha: 0.78,
    weather: "produce",
    gators: true,
  },
  snow: {
    props: ["pine-0", "pine-1"],
    propH: 1.7,
    roadside: 0.95,
    count: 8,
    clouds: true,
    cloudAlpha: 0.7,
    weather: null,
    gators: false,
  },
  desert: {
    props: ["cactus-0", "cactus-1"],
    propH: 1.25,
    roadside: 1.0,
    count: 8,
    clouds: true,
    cloudAlpha: 0.55,
    weather: null,
    gators: false,
  },
  lantern: {
    props: ["cherry-0", "lantern-0", "cherry-0"],
    propH: 1.55,
    roadside: 0.9,
    count: 8,
    clouds: false,
    cloudAlpha: 0,
    weather: null,
    gators: false,
  },
};

export const SPRITE_NAMES = [
  ...PRODUCE[0],
  ...PRODUCE[1],
  ...PRODUCE[2],
  "gator",
  "palm-0",
  "palm-1",
  "palm-2",
  ...CLOUD_NAMES,
  "pine-0",
  "pine-1",
  "cactus-0",
  "cactus-1",
  "lantern-0",
  "cherry-0",
  "petal-0",
];

const GATOR_LEN = 1.72;
const HIT_Z = 1.48;
const WORLD_LEN = 36;

type Produce = {
  xw: number;
  z: number;
  yw: number;
  vy: number;
  rot: number;
  spin: number;
  tumble: number;
  tumbleSpin: number;
  s: number;
  kind: 0 | 1 | 2;
  variant: 0 | 1 | 2;
  settled: boolean;
  petal: boolean;
  mode: "produce" | "petals" | "snow" | "dust";
};

type Gator = {
  xw: number;
  z: number;
  hit: boolean;
  squash: number;
  facing: 1 | -1;
};

type Prop = {
  xw: number;
  z: number;
  variant: number;
  lean: number;
};

type Cloud = {
  x: number;
  y: number;
  s: number;
  variant: 0 | 1 | 2;
  drift: number;
};

const sprites: Record<string, HTMLImageElement> = {};
const spriteLoads = new Map<string, Promise<void>>();

export function loadTributeSprites(base: string, onProgress?: () => void): Promise<void> {
  const root = assetRoot(base);
  const cached = spriteLoads.get(root);
  if (cached) return cached;

  const loading = Promise.all(
    SPRITE_NAMES.map(async (name) => {
      try {
        if (!sprites[name]?.complete || !sprites[name]?.naturalWidth) {
          sprites[name] = await loadImageAsset(`${root}sprites/${name}.png`);
        }
      } catch {
        // Tribute artwork is optional; the road and weather have non-image fallbacks.
      } finally {
        onProgress?.();
      }
    }),
  ).then(() => undefined);
  spriteLoads.set(root, loading);
  return loading;
}

function spr(name: string): HTMLImageElement | null {
  const img = sprites[name];
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

function advance(z: number, speed: number, dt: number) {
  return z - Math.max(0, speed) * WORLD_SPEED * dt;
}

export class TributeFx {
  private kind: SceneKind = "florida";
  private gators: Gator[] = [];
  private drops: Produce[] = [];
  private props: Prop[] = [];
  private clouds: Cloud[] = [];
  private spawn = 0;
  private rain = 2.5;
  private idle = 4;
  private bump = false;

  consumeBump() {
    const hit = this.bump;
    this.bump = false;
    return hit;
  }

  reset(kind: SceneKind = "florida") {
    this.kind = kind;
    const spec = FX[kind];
    this.gators = [];
    this.drops = [];
    this.props = [];
    this.clouds = [];
    this.spawn = 0;
    this.rain = 0.6;
    this.idle = 4;
    this.bump = false;
    if (!spec) return;

    if (spec.gators) {
      this.gators = [
        { xw: -0.5, z: 14.5, hit: false, squash: 0, facing: 1 },
        { xw: 0.46, z: 8.2, hit: false, squash: 0, facing: -1 },
        { xw: -0.06, z: 3.6, hit: false, squash: 0, facing: 1 },
      ];
    }
    for (let i = 0; i < spec.count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      this.props.push({
        xw: side * (ROAD_H + spec.roadside + (i % 5) * 0.38),
        z: 6.5 + ((i * 3.4) % (WORLD_LEN - 8)),
        variant: i % spec.props.length,
        lean: side * (0.02 + (i % 4) * 0.02),
      });
    }
    if (spec.clouds) {
      for (let i = 0; i < 7; i++) {
        this.clouds.push({
          x: (i * 0.23 + 0.04) % 1.4 - 0.15,
          y: 0.07 + (i % 4) * 0.055,
          s: 0.45 + (i % 3) * 0.28,
          variant: (i % 3) as 0 | 1 | 2,
          drift: 0.012 + (i % 5) * 0.006,
        });
      }
    }
    if (spec.weather) {
      const fill =
        spec.weather === "snow" ? 120 : spec.weather === "dust" ? 80 : spec.weather === "petals" ? 56 : 16;
      for (let i = 0; i < fill; i++) this.spawnDrop(spec.weather);
    }
  }

  private spawnGator() {
    const occupied = this.gators.filter((g) => !g.hit).map((g) => g.xw);
    const lanes = [-0.58, -0.22, 0.2, 0.55];
    const free = lanes.filter((lane) => occupied.every((x) => Math.abs(x - lane) > 0.32));
    const xw = free[Math.floor(Math.random() * free.length)] ?? (Math.random() < 0.5 ? -0.4 : 0.4);
    this.gators.push({
      xw,
      z: 22 + Math.random() * 12,
      hit: false,
      squash: 0,
      facing: xw < 0 ? 1 : -1,
    });
  }

  private spawnDrop(mode: "produce" | "petals" | "snow" | "dust") {
    const z = 2.8 + Math.random() * 24;
    const skyT = 0.02 + Math.random() * 0.36;
    const yw = CAM_H - (skyT - (1 - HORIZON)) * z;
    const spread = ROAD_H * 2.6 + z * 0.08;
    this.drops.push({
      xw: (Math.random() - 0.5) * spread,
      z,
      yw: Math.max(0.45, yw),
      vy:
        mode === "snow"
          ? 0.08 + Math.random() * 0.16
          : mode === "dust"
            ? 0.06 + Math.random() * 0.14
            : mode === "petals"
              ? 0.1 + Math.random() * 0.22
              : 0.2 + Math.random() * 0.45,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * (5 + Math.random() * 8),
      tumble: Math.random() * Math.PI * 2,
      tumbleSpin: (Math.random() - 0.5) * 6,
      s:
        mode === "snow"
          ? 0.18 + Math.random() * 0.28
          : mode === "dust"
            ? 0.16 + Math.random() * 0.3
            : mode === "petals"
              ? 0.28 + Math.random() * 0.28
              : 0.45 + Math.random() * 0.4,
      kind: Math.floor(Math.random() * 3) as 0 | 1 | 2,
      variant: Math.floor(Math.random() * 3) as 0 | 1 | 2,
      settled: false,
      petal: mode === "petals",
      mode,
    });
  }

  tick(dt: number, speed: number, kind: SceneKind): HypeLine | null {
    if (kind !== this.kind) this.reset(kind);
    const spec = FX[kind];
    let event: HypeLine | null = null;
    if (!spec) return event;

    if (spec.weather) {
      const always = spec.weather === "snow" || spec.weather === "dust" || spec.weather === "petals";
      const cap =
        spec.weather === "snow" ? 160 : spec.weather === "petals" ? 90 : spec.weather === "dust" ? 110 : 52;
      this.rain += dt * (always ? 1.8 : speed > 1.2 ? 1.15 : 0.08);
      if (this.rain > 1 && this.drops.length < cap) {
        this.rain = Math.random() * -0.28;
        const n =
          spec.weather === "snow"
            ? 2 + Math.floor(Math.random() * 4)
            : spec.weather === "petals"
              ? 1 + Math.floor(Math.random() * 3)
              : 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) this.spawnDrop(spec.weather);
      }
      for (const d of this.drops) {
        d.z = advance(d.z, speed, dt);
        d.rot += d.spin * dt;
        d.tumble += d.tumbleSpin * dt;
        if (d.settled) {
          d.spin *= Math.exp(-dt * 1.8);
          d.tumbleSpin *= Math.exp(-dt * 2.4);
          continue;
        }
        const g = d.mode === "snow" ? 0.35 : d.mode === "dust" ? 0.28 : d.mode === "petals" ? 0.55 : 1.15;
        d.vy += g * dt;
        d.yw -= d.vy * dt;
        d.xw += (d.mode === "dust" ? 0.55 : 0) * dt + (Math.random() - 0.5) * 0.28 * dt;
        if (d.yw <= 0) {
          d.yw = 0;
          d.settled = true;
          d.vy = 0;
          d.spin *= 0.2;
          d.tumbleSpin *= 0.12;
        }
      }
      this.drops = this.drops.filter((d) => d.z > 1.02 && d.z < WORLD_LEN + 8);
    }

    if (spec.gators) {
      const live = this.gators.filter((g) => !g.hit && g.z > 5).length;
      this.spawn += dt * (0.1 + speed * 0.022);
      if (this.spawn > 1 && live < 4) {
        this.spawn = 0;
        this.spawnGator();
      }
      for (const g of this.gators) {
        g.z = advance(g.z, speed, dt);
        if (g.hit) g.squash = Math.min(1, g.squash + dt * 3.6);
        if (!g.hit && g.z < HIT_Z) {
          g.hit = true;
          this.bump = true;
          const hits: HypeLine[] = ["jesus", "oh-my", "holy", "gator", "oh-no"];
          event = hits[Math.floor(Math.random() * hits.length)]!;
        }
      }
      this.gators = this.gators.filter((g) => g.z > 0.72 && g.squash < 1);
    }

    for (const p of this.props) {
      p.z = advance(p.z, speed, dt);
      if (p.z < 2.8) {
        p.z += WORLD_LEN + Math.random() * 4;
        p.variant = Math.floor(Math.random() * spec.props.length);
      }
    }
    for (const c of this.clouds) {
      c.x -= (0.006 + Math.max(0, speed) * 0.0011 * c.drift) * dt;
      if (c.x < -0.35) c.x += 1.55;
    }

    if (spec.gators) {
      this.idle += dt;
      if (!event && this.idle > 16 && speed > 3) {
        this.idle = 0;
        const pool: HypeLine[] = ["oh-my", "holy", "bananas", "hotdogs", "cukes", "jesus"];
        event = pool[Math.floor(Math.random() * pool.length)]!;
      }
    }
    return event;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    kind: SceneKind,
    t: number,
    shake = 0,
    bump = 0,
    includeAmbientWeather = true,
  ) {
    ctx.clearRect(0, 0, w, h);
    const spec = FX[kind];
    if (!spec) return;
    ctx.save();
    ctx.translate(Math.sin(t * 63) * shake * 10, bump * 16 + Math.sin(t * 81) * shake * 6);

    for (const c of this.clouds) drawCloud(ctx, w, h, c, spec.cloudAlpha);

    type Sprite = { z: number; draw: () => void };
    const queue: Sprite[] = [];
    for (const p of this.props) {
      queue.push({ z: p.z, draw: () => drawProp(ctx, w, h, p, spec.props, spec.propH) });
    }
    for (const g of this.gators) {
      queue.push({ z: g.z, draw: () => drawGator(ctx, w, h, g) });
    }
    for (const d of this.drops) {
      if (!includeAmbientWeather && d.mode !== "produce") continue;
      queue.push({
        z: d.z - d.yw * 0.15,
        draw: () => {
          if (d.mode === "snow") drawFlake(ctx, w, h, d);
          else if (d.mode === "dust") drawDust(ctx, w, h, d);
          else if (d.mode === "petals") drawPetal(ctx, w, h, d);
          else drawProduce(ctx, w, h, d);
        },
      });
    }
    queue.sort((a, b) => b.z - a.z);
    for (const s of queue) s.draw();

    ctx.restore();
  }
}

function drawProp(ctx: CanvasRenderingContext2D, w: number, h: number, p: Prop, names: string[], height: number) {
  const name = names[p.variant % names.length]!;
  const img = spr(name) ?? spr(names[0]!);
  if (!img) return;
  const pr = project(p.xw, p.z, w, h);
  if (pr.z < 2.6) return;
  const dh = Math.min((height / pr.z) * h, h * 0.46);
  const dw = dh * (img.naturalWidth / Math.max(1, img.naturalHeight));
  const fog = Math.max(0, Math.min(1, (pr.z - 14) / 16));
  ctx.save();
  ctx.translate(pr.x, pr.y);
  ctx.rotate(p.lean);
  ctx.globalAlpha = 1 - fog * 0.85;
  ctx.drawImage(img, -dw / 2, -dh, dw, dh);
  ctx.restore();
}

function drawGator(ctx: CanvasRenderingContext2D, w: number, h: number, g: Gator) {
  const img = spr("gator");
  if (!img) return;
  const p = project(g.xw, g.z, w, h);
  const dw = GATOR_LEN * p.scale * w;
  const ratio = img.naturalHeight / Math.max(1, img.naturalWidth);
  const dh = Math.max(4, dw * ratio * 0.52);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(g.facing, 1 - g.squash * 0.7);
  ctx.globalAlpha = 1 - g.squash * 0.4;
  ctx.fillStyle = "rgba(16, 12, 8, 0.38)";
  ctx.beginPath();
  ctx.ellipse(dw * 0.02, 0, dw * 0.4, Math.max(1.4, dw * 0.024), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(img, -dw / 2, -dh * 0.72, dw, dh);
  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, w: number, h: number, c: Cloud, alpha: number) {
  const img = spr(CLOUD_NAMES[c.variant]!) ?? spr("cloud-0");
  if (!img) return;
  const dw = w * 0.22 * c.s;
  const dh = dw * (img.naturalHeight / Math.max(1, img.naturalWidth));
  ctx.save();
  ctx.globalAlpha = (0.55 + c.s * 0.25) * alpha;
  ctx.drawImage(img, c.x * w - dw * 0.3, c.y * h - dh * 0.35, dw, dh);
  ctx.restore();
}

function drawProduce(ctx: CanvasRenderingContext2D, w: number, h: number, d: Produce) {
  const name = PRODUCE[d.kind][d.variant] ?? PRODUCE[d.kind][0]!;
  const img = spr(name) ?? spr(PRODUCE[d.kind][0]!);
  if (!img) return;
  const p = project(d.xw, d.z, w, h, d.yw);
  const world = (d.kind === 0 ? 0.34 : d.kind === 1 ? 0.5 : 0.42) * d.s;
  const dw = Math.min(world * p.scale * w, w * 0.1);
  const dh = dw * (img.naturalHeight / Math.max(1, img.naturalWidth));
  const near = Math.max(0, Math.min(1, 1.15 - d.z / 22));
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(d.rot);
  ctx.scale(Math.cos(d.tumble), 1);
  ctx.globalAlpha = 0.55 + near * 0.45;
  if (!d.settled && d.yw > 0.2) ctx.filter = `blur(${Math.min(2.8, d.yw * 2.2).toFixed(1)}px)`;
  ctx.drawImage(img, -dw / 2, d.settled ? -dh * 0.85 : -dh / 2, dw, dh);
  ctx.filter = "none";
  ctx.restore();
}

function drawPetal(ctx: CanvasRenderingContext2D, w: number, h: number, d: Produce) {
  const img = spr("petal-0");
  if (!img) return;
  const p = project(d.xw, d.z, w, h, d.yw);
  const dw = 0.4 * d.s * p.scale * w;
  const dh = dw * (img.naturalHeight / Math.max(1, img.naturalWidth));
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(d.rot);
  ctx.globalAlpha = 0.7;
  ctx.drawImage(img, -dw / 2, d.settled ? -dh * 0.7 : -dh / 2, dw, dh);
  ctx.restore();
}

function drawFlake(ctx: CanvasRenderingContext2D, w: number, h: number, d: Produce) {
  const p = project(d.xw, d.z, w, h, d.yw);
  const r = Math.max(0.9, Math.min(5.5, 0.16 * d.s * p.scale * w));
  ctx.save();
  ctx.globalAlpha = d.settled ? 0.55 : 0.85;
  ctx.fillStyle = "#f4f8ff";
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDust(ctx: CanvasRenderingContext2D, w: number, h: number, d: Produce) {
  const p = project(d.xw, d.z, w, h, d.yw);
  const r = Math.max(0.8, Math.min(4.5, 0.12 * d.s * p.scale * w));
  ctx.save();
  ctx.globalAlpha = d.settled ? 0.28 : 0.55;
  ctx.fillStyle = d.kind === 0 ? "#c9843a" : d.kind === 1 ? "#e0b06a" : "#a86a2a";
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const tributeFx = new TributeFx();
