import { useEffect, useState, type ReactNode } from "react";
import { SCENES, sceneById } from "../scenes";
import { driveEngine } from "../engine";
import { applyCarBrowserDefaults, startGpsWatch } from "../gps";
import { loadDriveRuntime } from "../loader";
import { useDrive } from "../store";
import { BrandMark } from "./BrandMark";
import { HeaderBar } from "./HeaderBar";
import { Hud } from "./Hud";
import { SceneCanvas } from "./SceneCanvas";
import { SceneDock } from "./SceneDock";
import { SettingsPanel } from "./SettingsPanel";
import { Throttle } from "./Throttle";

function useTheme() {
  const theme = useDrive((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark =
        theme === "dark" ||
        (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
}

function useDriveLoop() {
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = useDrive.getState();
      s.tick(dt);
      const scene = sceneById(s.sceneId);
      driveEngine.set(s.rpm, s.load, scene.voice, scene.idleRpm);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}

function useGps() {
  const started = useDrive((s) => s.started);
  useEffect(() => {
    applyCarBrowserDefaults();
    if (!started) return;
    return startGpsWatch();
  }, [started]);
}

function useKeys() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const s = useDrive.getState();
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        s.setThrottle(true);
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        s.setBrake(true);
      } else if (e.code === "KeyA" || e.code === "BracketLeft") s.shift(-1);
      else if (e.code === "KeyZ" || e.code === "BracketRight" || e.code === "KeyQ") s.shift(1);
      else if (e.code === "KeyM") s.setMuted(!s.muted);
      else if (e.code === "KeyD") s.setDockOpen(!s.dockOpen);
      else if (e.code.startsWith("Digit")) {
        const idx = e.code === "Digit0" ? 9 : Number(e.code.replace("Digit", "")) - 1;
        const id = SCENES[idx]?.id;
        if (id) s.setScene(id);
      }
    };
    const up = (e: KeyboardEvent) => {
      const s = useDrive.getState();
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") s.setThrottle(false);
      if (e.code === "ArrowDown" || e.code === "KeyS") s.setBrake(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
}

type BootStatus = {
  progress: number;
  detail: string;
  ready: boolean;
};

function BootScreen({ status }: { status: BootStatus }) {
  const percent = Math.round(status.progress * 100);
  return (
    <main className="vd-boot" aria-label="Loading VibeDrive" aria-live="polite">
      <div className="vd-boot-orbit vd-boot-orbit-a" aria-hidden />
      <div className="vd-boot-orbit vd-boot-orbit-b" aria-hidden />
      <div className="vd-boot-card">
        <BrandMark large />
        <div className="vd-wordmark">VibeDrive</div>
        <p className="vd-boot-kicker">CINEMATIC DRIVE SYSTEM</p>
        <div
          className="vd-loader"
          role="progressbar"
          aria-label="Loading driving systems"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <span className="vd-loader-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="vd-boot-status">
          <span>{status.detail}</span>
          <span>{percent}%</span>
        </div>
      </div>
    </main>
  );
}

export function DriveApp({ account }: { account?: ReactNode }) {
  const booted = useDrive((s) => s.booted);
  const started = useDrive((s) => s.started);
  const sceneId = useDrive((s) => s.sceneId);
  const wheelRight = useDrive((s) => s.wheelRight);
  const muted = useDrive((s) => s.muted);
  const engineVolume = useDrive((s) => s.engineVolume);
  const setBooted = useDrive((s) => s.setBooted);
  const startSession = useDrive((s) => s.startSession);
  const [bootStatus, setBootStatus] = useState<BootStatus>({
    progress: 0,
    detail: "Restoring cabin settings…",
    ready: false,
  });
  const scene = sceneById(sceneId);
  useTheme();
  useDriveLoop();
  useGps();
  useKeys();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const base = import.meta.env.BASE_URL || "/";
      const update = (progress: number, detail: string, ready = false) => {
        if (!cancelled) setBootStatus({ progress, detail, ready });
      };

      update(0.02, "Restoring cabin settings…");
      try {
        await Promise.resolve(useDrive.persist.rehydrate());
      } catch (err) {
        console.warn("VibeDrive settings restore skipped", err);
      }
      if (cancelled) return;

      setBooted(true);
      update(0.04, "Warming the Rust driving core…");
      try {
        await loadDriveRuntime(base, (status) => {
          if (!cancelled) setBootStatus({ ...status, ready: false });
        });
      } catch (err) {
        console.error("VibeDrive runtime preload failed", err);
        update(0.96, "Starting with local fallbacks…");
      }
      if (cancelled) return;

      update(1, "Cabin ready", true);
      try {
        applyCarBrowserDefaults();
        driveEngine.unlock();
        driveEngine.start();
        driveEngine.setVolume(useDrive.getState().engineVolume);
      } catch (err) {
        console.warn("VibeDrive audio is waiting for browser permission", err);
      }
      if (!useDrive.getState().started) startSession();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [setBooted, startSession]);

  useEffect(() => {
    driveEngine.setMuted(muted);
    driveEngine.setVolume(engineVolume);
  }, [muted, engineVolume]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") driveEngine.unlock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div
      className={wheelRight ? "vd-shell is-right" : "vd-shell"}
      style={{ "--accent": scene.accent } as React.CSSProperties}
    >
      {!booted || !bootStatus.ready || !started ? (
        <BootScreen status={bootStatus} />
      ) : (
        <>
          <HeaderBar account={account} />
          <main className="vd-body">
            <section className="vd-stage">
              <SceneCanvas />
              <span className="vd-vignette" />
              <Hud />
              <Throttle />
            </section>
            <SceneDock />
          </main>
          <SettingsPanel />
        </>
      )}
    </div>
  );
}
