import { useEffect, useRef } from "react";
import { sceneById } from "../scenes";
import { useDrive } from "../store";
import { renderScene } from "../canvas/render";
import { loadTributeSprites, tributeFx } from "../canvas/tribute";
import { cabinHype } from "../callouts";
import { GlRoad } from "../gl/renderer";

export function SceneCanvas() {
  const glRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const skyARef = useRef<HTMLImageElement>(null);
  const skyBRef = useRef<HTMLImageElement>(null);
  const sceneId = useDrive((s) => s.sceneId);
  const scene = sceneById(sceneId);
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");

  useEffect(() => {
    const canvas = glRef.current;
    const fx = fxRef.current;
    if (!canvas || !fx) return;
    let raf = 0;
    let running = true;
    const t0 = performance.now();
    let gl: GlRoad | null = null;
    let ctx2d: CanvasRenderingContext2D | null = null;
    let fpsAcc = 0;
    let last = performance.now();
    let lastKind = "";
    let travel = 0;
    tributeFx.reset();
    loadTributeSprites(base);

    const parent0 = canvas.parentElement;
    if (parent0) {
      const dpr0 = Math.min(2, window.devicePixelRatio || 1);
      const iw = Math.max(1, Math.min(parent0.clientWidth || window.innerWidth, 3840));
      const ih = Math.max(1, Math.min(parent0.clientHeight || window.innerHeight, 2160));
      canvas.width = Math.max(1, Math.floor(iw * dpr0));
      canvas.height = Math.max(1, Math.floor(ih * dpr0));
    }

    try {
      gl = new GlRoad(canvas, base);
      void gl.attachWasm(base);
    } catch (err) {
      console.error("VibeDrive GL init failed", err);
      ctx2d = canvas.getContext("2d");
    }
    const fxCtx = fx.getContext("2d");

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.min(parent.clientWidth || window.innerWidth, 3840));
      const h = Math.max(1, Math.min(parent.clientHeight || window.innerHeight, 2160));
      const bw = Math.max(1, Math.floor(w * dpr));
      const bh = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      fx.style.width = `${w}px`;
      fx.style.height = `${h}px`;
      if (canvas.width !== bw) canvas.width = bw;
      if (canvas.height !== bh) canvas.height = bh;
      if (fx.width !== bw) fx.width = bw;
      if (fx.height !== bh) fx.height = bh;
      if (gl) gl.resize(w, h, dpr);
      if (ctx2d) ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      fxCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = useDrive.getState();
      const sc = sceneById(st.sceneId);
      if (sc.kind !== lastKind) {
        tributeFx.reset();
        lastKind = sc.kind;
        travel = 0;
      }
      travel += Math.max(0, st.speedMps) * dt;
      const cycle = 280;
      const u = (travel / cycle) % 1;
      const fade = Math.max(0, (u - 0.9) / 0.1);
      const pan = 50 + Math.sin(travel * 0.006) * 1.6;
      const skyA = skyARef.current;
      const skyB = skyBRef.current;
      if (skyA && skyB) {
        skyA.style.transform = `scale(${(1 + u * 0.05).toFixed(4)})`;
        skyA.style.opacity = fade > 0 ? String(1 - fade) : "1";
        skyA.style.objectPosition = `${pan.toFixed(2)}% 100%`;
        skyB.style.transform = "scale(1)";
        skyB.style.opacity = String(fade);
        skyB.style.objectPosition = `${pan.toFixed(2)}% 100%`;
      }
      if (gl) {
        gl.frame(now, sc, st.speedMps, st.load, st.shake, st.bump);
        fpsAcc += 1;
        if (fpsAcc % 20 === 0) st.setFps(gl.fps);
      } else if (ctx2d) {
        renderScene(ctx2d, canvas.clientWidth, canvas.clientHeight, sc, {
          t: (now - t0) / 1000,
          speedMps: st.speedMps,
          load: st.load,
          rpm: st.rpm,
          gear: st.gear,
        });
      }
      const shout = tributeFx.tick(dt, st.speedMps, sc.kind);
      if (shout) cabinHype.shout(shout);
      if (tributeFx.consumeBump()) st.hitBump();
      if (fxCtx) tributeFx.draw(fxCtx, fx.clientWidth, fx.clientHeight, sc.kind, now / 1000, st.shake, st.bump);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [base]);

  return (
    <>
      <div className="scene-sky-fall" style={{ background: `linear-gradient(${scene.sky[0]}, ${scene.sky[1]})` }} />
      <img ref={skyARef} className="scene-sky" src={`${base}skies/${scene.kind}.jpg`} alt="" draggable={false} />
      <img ref={skyBRef} className="scene-sky" src={`${base}skies/${scene.kind}.jpg`} alt="" draggable={false} />
      <canvas ref={glRef} className="scene-canvas" aria-hidden />
      <canvas ref={fxRef} className="scene-fx" aria-hidden />
    </>
  );
}
