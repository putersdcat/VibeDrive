import type { HypeLine } from "../callouts";
import type { SceneKind } from "../types";

type Gator = { lane: number; z: number; hit: boolean; wobble: number };
type Drop = { x: number; y: number; s: number; rot: number; kind: 0 | 1 | 2 };

export class TributeFx {
  private gators: Gator[] = [];
  private drops: Drop[] = [];
  private spawn = 0;
  private idle = 4;
  private xingT = 0;

  reset() {
    this.gators = [{ lane: 0.18, z: 0.42, hit: false, wobble: 1.2 }];
    this.drops = [];
    this.spawn = 0;
    this.idle = 4;
    this.xingT = 0;
  }

  tick(dt: number, speed: number, kind: SceneKind): HypeLine | null {
    let event: HypeLine | null = null;
    if (kind === "florida") {
      if (this.drops.length < 48) {
        this.drops.push({
          x: Math.random() * 2 - 1,
          y: -Math.random() * 0.4,
          s: 0.6 + Math.random() * 1.1,
          rot: Math.random() * Math.PI,
          kind: (Math.floor(Math.random() * 3) as 0 | 1 | 2),
        });
      }
      for (const d of this.drops) {
        d.y += dt * (0.22 + speed * 0.012) * d.s;
        d.rot += dt * 1.4;
        if (d.y > 1.15) {
          d.y = -0.08;
          d.x = Math.random() * 2 - 1;
        }
      }
      this.spawn += dt * (0.18 + speed * 0.035);
      if (this.spawn > 1 && this.gators.length < 3 && speed > 2) {
        this.spawn = 0;
        this.gators.push({
          lane: Math.random() < 0.5 ? -0.22 : 0.22,
          z: 0.04,
          hit: false,
          wobble: Math.random() * 6,
        });
      }
      for (const g of this.gators) {
        g.z += dt * (0.1 + speed * 0.02);
        if (!g.hit && g.z > 0.86) {
          g.hit = true;
          event = Math.random() < 0.55 ? "gator" : "jesus";
        }
      }
      this.gators = this.gators.filter((g) => g.z < 1.2);
      this.idle += dt;
      if (!event && this.idle > 12 && speed > 3) {
        this.idle = 0;
        const pool: HypeLine[] = ["oh-my", "bananas", "hotdogs", "cukes", "jesus", "oh-no"];
        event = pool[Math.floor(Math.random() * pool.length)]!;
      }
    } else if (kind === "xing") {
      this.xingT += dt;
      if (this.xingT > 13 && speed > 4) {
        this.xingT = 0;
        event = Math.random() < 0.5 ? "phantom" : "oh-no";
      }
    } else {
      this.idle = 4;
    }
    return event;
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, kind: SceneKind, t: number) {
    ctx.clearRect(0, 0, w, h);
    if (kind === "florida") {
      for (const d of this.drops) {
        const x = w * (0.5 + d.x * 0.46);
        const y = d.y * h;
        drawProduce(ctx, x, y, 8 + 16 * d.s * Math.min(1, d.y + 0.2), d.rot, d.kind);
      }
      const vpY = h * 0.42;
      for (const g of this.gators) {
        const p = g.z * g.z;
        const x = w * 0.5 + g.lane * w * p * 1.6;
        const y = vpY + (h - vpY) * p;
        drawGator(ctx, x, y, 0.25 + 2.4 * p, t + g.wobble);
      }
    }
    if (kind === "xing") {
      const flash = Math.floor(t * 4) % 2 === 0;
      ctx.fillStyle = flash ? "rgba(255,40,40,0.55)" : "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.arc(w * 0.22, h * 0.38, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = flash ? "rgba(255,255,255,0.45)" : "rgba(255,40,40,0.55)";
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.38, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(80, 230, 255, 0.35)";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) {
        const x = w * (0.28 + i * 0.08);
        ctx.strokeRect(x, h * 0.46, 28 + i * 4, 18 + i * 6);
      }
    }
  }
}

function drawProduce(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  rot: number,
  kind: 0 | 1 | 2,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (kind === 0) {
    ctx.fillStyle = "#f4d03f";
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.38, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3d6b1e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, -s * 0.1);
    ctx.lineTo(-s * 0.95, -s * 0.45);
    ctx.stroke();
  } else if (kind === 1) {
    ctx.fillStyle = "#3fa34d";
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.32, s * 0.95, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a6b32";
    ctx.fillRect(-s * 0.12, -s * 1.05, s * 0.24, s * 0.2);
  } else {
    ctx.fillStyle = "#c45c26";
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.95, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0d7a4";
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.95, s * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b2a12";
    ctx.fillRect(-s * 0.7, -s * 0.08, s * 1.4, s * 0.12);
  }
  ctx.restore();
}

function drawGator(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "#1f4a28";
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(26, -3, 13, 8, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#16351c";
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.quadraticCurveTo(-50, Math.sin(t * 7) * 7, -62, 2);
  ctx.quadraticCurveTo(-44, 9, -24, 5);
  ctx.fill();
  ctx.fillStyle = "#c6e86a";
  ctx.beginPath();
  ctx.arc(30, -6, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#16351c";
  for (const lx of [-8, 6, 16]) {
    ctx.fillRect(lx, 8, 7, 5);
    ctx.fillRect(lx - 18, 8, 7, 5);
  }
  ctx.restore();
}

export const tributeFx = new TributeFx();
