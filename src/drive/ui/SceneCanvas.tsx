import { useEffect, useRef } from "react";
import { sceneById } from "../scenes";
import { useDrive } from "../store";
import { renderScene } from "../canvas/render";

export function SceneCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const sceneId = useDrive((s) => s.sceneId);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let running = true;
    const t0 = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const loop = (now: number) => {
      if (!running) return;
      const st = useDrive.getState();
      const scene = sceneById(st.sceneId);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderScene(ctx, w, h, scene, {
        t: (now - t0) / 1000,
        speedMps: st.speedMps,
        load: st.load,
        rpm: st.rpm,
        gear: st.gear,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [sceneId]);

  return <canvas ref={ref} className="scene-canvas" aria-hidden />;
}
