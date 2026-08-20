import { useEffect, useRef } from "react";
import { sceneById } from "../scenes";
import { useDrive } from "../store";
import { renderScene } from "../canvas/render";
import { tributeFx } from "../canvas/tribute";
import { cabinHype } from "../callouts";
import { GlRoad } from "../gl/renderer";

export function SceneCanvas() {
  const glRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);

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
    tributeFx.reset();

    try {
      gl = new GlRoad(canvas);
      const base = import.meta.env.BASE_URL || "/";
      void gl.attachWasm(base);
    } catch {
      ctx2d = canvas.getContext("2d");
    }
    const fxCtx = fx.getContext("2d");

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      fx.style.width = `${w}px`;
      fx.style.height = `${h}px`;
      if (gl) {
        gl.resize(w, h, dpr);
      } else if (ctx2d) {
        canvas.width = Math.max(1, Math.floor(w * dpr));
        canvas.height = Math.max(1, Math.floor(h * dpr));
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      fx.width = Math.max(1, Math.floor(w * dpr));
      fx.height = Math.max(1, Math.floor(h * dpr));
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
      const scene = sceneById(st.sceneId);
      if (scene.kind !== lastKind) {
        tributeFx.reset();
        lastKind = scene.kind;
      }
      if (gl) {
        gl.frame(now, scene, st.speedMps, st.load);
        fpsAcc += 1;
        if (fpsAcc % 20 === 0) st.setFps(gl.fps);
      } else if (ctx2d) {
        renderScene(ctx2d, canvas.clientWidth, canvas.clientHeight, scene, {
          t: (now - t0) / 1000,
          speedMps: st.speedMps,
          load: st.load,
          rpm: st.rpm,
          gear: st.gear,
        });
      }
      const shout = tributeFx.tick(dt, st.speedMps, scene.kind);
      if (shout) cabinHype.shout(shout);
      if (fxCtx) tributeFx.draw(fxCtx, fx.clientWidth, fx.clientHeight, scene.kind, now / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      <canvas ref={glRef} className="scene-canvas" aria-hidden />
      <canvas ref={fxRef} className="scene-fx" aria-hidden />
    </>
  );
}
