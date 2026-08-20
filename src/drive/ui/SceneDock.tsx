import { useEffect, useRef } from "react";
import { paintThumb } from "../canvas/render";
import { SCENES } from "../scenes";
import type { Scene } from "../types";
import { useDrive } from "../store";

function Thumb({ scene, selected }: { scene: Scene; selected: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintThumb(ref.current, scene);
  }, [scene]);
  return (
    <canvas
      ref={ref}
      className={selected ? "scene-thumb is-selected" : "scene-thumb"}
      aria-hidden
    />
  );
}

export function SceneDock() {
  const open = useDrive((s) => s.dockOpen);
  const sceneId = useDrive((s) => s.sceneId);
  const setScene = useDrive((s) => s.setScene);
  const setDockOpen = useDrive((s) => s.setDockOpen);
  if (!open) {
    return (
      <button
        type="button"
        className="vd-dock-handle"
        aria-label="Show scenes"
        onClick={() => setDockOpen(true)}
      >
        <svg viewBox="0 0 14 20" width="12" height="16" aria-hidden>
          <path
            d="M4.8 3.6 10.2 10l-5.4 6.4"
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

  return (
    <aside className="vd-dock">
      <div className="vd-dock-head">
        <span>Scenes</span>
        <span className="vd-dock-plan">8 open · no paywall</span>
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
                  {scene.hasMusic ? (
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-label="Has music">
                      <path
                        d="M6.4 12.2V3.9l6.2-1.5v8.3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle cx="4.4" cy="12.3" r="2" fill="currentColor" />
                      <circle cx="10.6" cy="10.7" r="2" fill="currentColor" />
                    </svg>
                  ) : null}
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
  );
}
