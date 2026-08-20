import { useEffect, useRef } from "react";
import { paintThumb } from "../canvas/render";
import { SCENES } from "../scenes";
import type { Scene } from "../types";
import { useDrive } from "../store";

function Thumb({ scene, selected }: { scene: Scene; selected: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const draw = () => {
      if (ref.current) paintThumb(ref.current, scene);
    };
    draw();
    const img = new Image();
    img.onload = draw;
    const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
    img.src = `${base}skies/${scene.kind}.jpg`;
    return () => {
      img.onload = null;
    };
  }, [scene]);
  return (
    <canvas
      ref={ref}
      className={selected ? "scene-thumb is-selected" : "scene-thumb"}
      aria-hidden
    />
  );
}

function Slider({ open, onToggle }: { open: boolean; onToggle: (next: boolean) => void }) {
  const startX = useRef(0);
  const moved = useRef(false);
  return (
    <button
      type="button"
      className={open ? "vd-dock-slider is-open" : "vd-dock-slider"}
      aria-label={open ? "Hide scenes" : "Show scenes"}
      aria-pressed={open}
      onPointerDown={(e) => {
        startX.current = e.clientX;
        moved.current = false;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (Math.abs(e.clientX - startX.current) > 10) moved.current = true;
      }}
      onPointerUp={(e) => {
        const dx = e.clientX - startX.current;
        if (open && dx > 40) onToggle(false);
        else if (!open && dx < -40) onToggle(true);
        else if (!moved.current) onToggle(!open);
      }}
    >
      <svg viewBox="0 0 14 20" width="12" height="16" aria-hidden>
        <path
          d={open ? "M9.2 3.6 3.8 10l5.4 6.4" : "M4.8 3.6 10.2 10l-5.4 6.4"}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function SceneDock() {
  const open = useDrive((s) => s.dockOpen);
  const sceneId = useDrive((s) => s.sceneId);
  const setScene = useDrive((s) => s.setScene);
  const setDockOpen = useDrive((s) => s.setDockOpen);

  if (!open) {
    return (
      <div className="vd-dock-layer">
        <Slider open={false} onToggle={setDockOpen} />
      </div>
    );
  }

  return (
    <div className="vd-dock-layer">
    <aside className="vd-dock">
      <Slider open onToggle={setDockOpen} />
      <div className="vd-dock-head">
        <span>Scenes</span>
        <button type="button" className="vd-dock-close" onClick={() => setDockOpen(false)}>
          Close
        </button>
      </div>
      <div className="vd-scene-grid">
        {SCENES.map((scene) => {
          const selected = scene.id === sceneId;
          return (
            <button
              key={scene.id}
              type="button"
              className={selected ? "vd-scene is-selected" : "vd-scene"}
              onClick={() => setScene(scene.id)}
              style={{ "--scene-accent": scene.accent } as React.CSSProperties}
            >
              <span className="vd-scene-preview">
                <Thumb scene={scene} selected={selected} />
              </span>
              <span className="vd-scene-body">
                <span className="vd-scene-top">
                  <span className="vd-scene-name">{scene.name}</span>
                  {scene.hasManual ? (
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-label="Manual gearbox">
                      <path
                        d="M3.4 4.2v7.6M8 3.4v9.2M12.6 4.2v7.6M3.4 8h9.2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                      <circle cx="3.4" cy="4.2" r="1.9" fill="currentColor" />
                    </svg>
                  ) : null}
                </span>
                <span className="vd-scene-tag">{scene.tagline}</span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
    </div>
  );
}
