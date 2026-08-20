import type { Scene, SceneKind } from "../types";

export type RenderState = {
  t: number;
  speedMps: number;
  load: number;
  rpm: number;
  gear: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fillSky(ctx: CanvasRenderingContext2D, w: number, h: number, a: string, b: string) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function roadTrapezoid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  vpY: number,
  color: string,
  widthScale = 1,
) {
  const horizon = vpY;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, horizon);
  ctx.lineTo(w * (0.5 + 0.92 * widthScale), h + 20);
  ctx.lineTo(w * (0.5 - 0.92 * widthScale), h + 20);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function dashes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  vpY: number,
  offset: number,
  color: string,
) {
  ctx.fillStyle = color;
  const n = 28;
  for (let i = 0; i < n; i++) {
    const z = ((i / n + offset) % 1);
    const p = z * z;
    const y = vpY + (h - vpY) * p;
    const th = 3 + 18 * p;
    const tw = 2 + 10 * p;
    ctx.fillRect(w * 0.5 - tw / 2, y, tw, th);
  }
}

type Particle = { x: number; y: number; z: number; s: number; c: string };
const bags = new Map<string, Particle[]>();

function particles(kind: SceneKind, count: number): Particle[] {
  let bag = bags.get(kind);
  if (!bag) {
    bag = Array.from({ length: count }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random(),
      z: Math.random(),
      s: 0.4 + Math.random() * 1.4,
      c: "#fff",
    }));
    bags.set(kind, bag);
  }
  return bag;
}

function drawBuildings(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  vpY: number,
  t: number,
  neon: boolean,
) {
  const n = 18;
  for (let i = 0; i < n; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const depth = ((i * 0.17 + t * 0.08) % 1);
    const p = depth * depth;
    const x = w * 0.5 + side * (40 + 520 * p);
    const bh = (80 + (i % 5) * 40) * p * 2.2;
    const bw = 18 + 90 * p;
    const y = vpY + (h - vpY) * p * 0.35;
    ctx.fillStyle = neon
      ? i % 3 === 0
        ? "rgba(232,77,255,0.18)"
        : "rgba(20,12,32,0.85)"
      : "rgba(8,9,12,0.72)";
    ctx.fillRect(x - bw / 2, y - bh, bw, bh);
    if (neon) {
      ctx.fillStyle = i % 4 === 0 ? "rgba(106,212,255,0.5)" : "rgba(255,74,56,0.35)";
      ctx.fillRect(x - bw / 2, y - bh, bw, 3 * p + 1);
    }
  }
}

function drawMountains(ctx: CanvasRenderingContext2D, w: number, h: number, vpY: number) {
  ctx.beginPath();
  ctx.moveTo(0, vpY + 40);
  const peaks = [0.08, 0.18, 0.32, 0.45, 0.58, 0.72, 0.88, 1];
  for (const p of peaks) {
    const y = vpY - (40 + (Math.sin(p * 12) * 0.5 + 0.5) * 90);
    ctx.lineTo(w * p, y);
  }
  ctx.lineTo(w, vpY + 80);
  ctx.closePath();
  ctx.fillStyle = "#d8e6f0";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, vpY + 70);
  for (const p of peaks) {
    ctx.lineTo(w * p, vpY - 10 - Math.sin(p * 9) * 28);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = "#9eb4c6";
  ctx.fill();
}

function drawDunes(ctx: CanvasRenderingContext2D, w: number, h: number, vpY: number) {
  ctx.beginPath();
  ctx.moveTo(0, vpY + 30);
  for (let i = 0; i <= 12; i++) {
    const x = (w * i) / 12;
    const y = vpY + Math.sin(i * 0.9) * 28 - 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = "#c9843a";
  ctx.fill();
}

function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = "#e8f6ff";
  for (let i = 0; i < 80; i++) {
    const x = ((i * 97 + t * 8) % w);
    const y = (i * 53) % (h * 0.55);
    const s = 0.6 + (i % 4) * 0.5;
    ctx.fillRect(x, y, s, s);
  }
}

function drawLanterns(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  vpY: number,
  t: number,
) {
  for (let i = 0; i < 14; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const depth = (i * 0.13 + t * 0.05) % 1;
    const p = depth * depth;
    const x = w * 0.5 + side * (50 + 480 * p);
    const y = vpY + (h - vpY) * p * 0.42;
    const r = 3 + 14 * p;
    ctx.beginPath();
    ctx.arc(x, y - 40 * p, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,126,182,0.85)";
    ctx.fill();
  }
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: Scene,
  st: RenderState,
) {
  const vpY = h * 0.42;
  const dist = st.t * (0.08 + st.speedMps * 0.045);
  const dashOff = dist * 0.35;
  const [ar, ag, ab] = hexToRgb(scene.accent);
  const accent = `rgb(${ar},${ag},${ab})`;

  fillSky(ctx, w, h, scene.sky[0], scene.sky[1]);
  {
    const glow = ctx.createRadialGradient(w * 0.5, vpY, 4, w * 0.5, vpY, w * 0.42);
    glow.addColorStop(0, `rgba(${ar},${ag},${ab},0.32)`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  if (scene.kind === "snow") drawMountains(ctx, w, h, vpY);
  if (scene.kind === "desert") {
    ctx.beginPath();
    ctx.arc(w * 0.78, vpY * 0.55, 46, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd18a";
    ctx.fill();
    drawDunes(ctx, w, h, vpY);
  }
  if (scene.kind === "neon-city" || scene.kind === "night-road" || scene.kind === "clean-ev") {
    drawBuildings(ctx, w, h, vpY, dist, scene.kind === "neon-city");
  }
  if (scene.kind === "space") {
    drawStars(ctx, w, h, st.t);
    ctx.beginPath();
    ctx.ellipse(w * 0.72, vpY * 0.45, 70, 28, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(106,212,255,0.18)";
    ctx.fill();
  }
  if (scene.kind === "lantern") {
    drawBuildings(ctx, w, h, vpY, dist, false);
    drawLanterns(ctx, w, h, vpY, dist);
  }

  const roadColor =
    scene.kind === "snow"
      ? "#c5d2dc"
      : scene.kind === "desert"
        ? "#6b4a28"
        : scene.kind === "space"
          ? "#101428"
          : "#1a1c22";
  roadTrapezoid(ctx, w, h, vpY, roadColor);
  if (scene.kind !== "space") {
    ctx.save();
    ctx.globalAlpha = 0.55;
    roadTrapezoid(ctx, w, h, vpY, "rgba(255,255,255,0.06)", 0.12);
    ctx.restore();
  }
  dashes(
    ctx,
    w,
    h,
    vpY,
    dashOff,
    scene.kind === "clean-ev" ? accent : scene.kind === "snow" ? "#6a7a88" : "#e8eaee",
  );

  if (scene.kind === "rain") {
    ctx.strokeStyle = "rgba(210,230,240,0.35)";
    ctx.lineWidth = 1;
    const rain = particles("rain", 90);
    for (const p of rain) {
      p.y += (0.018 + st.speedMps * 0.001) * p.s;
      if (p.y > 1) {
        p.y = 0;
        p.x = Math.random() * 2 - 1;
      }
      const x = w * 0.5 + p.x * w * 0.7;
      const y = p.y * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4, y + 16 * p.s);
      ctx.stroke();
    }
  }

  if (scene.kind === "snow") {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    const snow = particles("snow", 70);
    for (const p of snow) {
      p.y += 0.004 * p.s;
      p.x += Math.sin(st.t + p.z * 8) * 0.0008;
      if (p.y > 1) p.y = 0;
      ctx.beginPath();
      ctx.arc(w * (p.x * 0.5 + 0.5), p.y * h, 1.2 * p.s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (scene.kind === "lantern") {
    const petals = particles("lantern", 40);
    ctx.fillStyle = "rgba(255,180,210,0.75)";
    for (const p of petals) {
      p.y += 0.003 * p.s;
      p.x += Math.sin(st.t * 0.6 + p.z * 6) * 0.001;
      if (p.y > 1) {
        p.y = 0;
        p.x = Math.random() * 2 - 1;
      }
      ctx.save();
      ctx.translate(w * (0.5 + p.x * 0.5), p.y * h);
      ctx.rotate(p.z * 4 + st.t);
      ctx.fillRect(-3, -1.5, 6, 3);
      ctx.restore();
    }
  }

  if (scene.kind === "desert") {
    ctx.fillStyle = "rgba(240,200,130,0.45)";
    const dust = particles("desert", 50);
    for (const p of dust) {
      p.x += 0.004 + st.speedMps * 0.0004;
      if (p.x > 1) p.x = -1;
      ctx.fillRect(w * (p.x * 0.5 + 0.5), h * (0.4 + p.y * 0.55), 2 * p.s, 1);
    }
  }

  const vig = ctx.createRadialGradient(w * 0.5, h * 0.55, h * 0.1, w * 0.5, h * 0.5, h * 0.85);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  if (st.load > 0.55 && st.speedMps > 8) {
    const shake = (st.load - 0.55) * 2;
    ctx.save();
    ctx.globalAlpha = shake * 0.12;
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

export function paintThumb(canvas: HTMLCanvasElement, scene: Scene) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = 280;
  const h = 160;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderScene(ctx, w, h, scene, { t: 4.2, speedMps: 22, load: 0.3, rpm: 3200, gear: 3 });
}
