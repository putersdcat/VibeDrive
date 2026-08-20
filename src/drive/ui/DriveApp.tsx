import { useEffect, useRef, type ReactNode } from "react";
import { SCENES, sceneById, TRACKS } from "../scenes";
import { driveEngine } from "../engine";
import { lofiPlayer } from "../music";
import { applyCarBrowserDefaults, startGpsWatch } from "../gps";
import { cabinHype } from "../callouts";
import { useDrive } from "../store";
import { HeaderBar } from "./HeaderBar";
import { Hud } from "./Hud";
import { MusicPlayer } from "./MusicPlayer";
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

export function DriveApp({ account }: { account?: ReactNode }) {
  const booted = useDrive((s) => s.booted);
  const started = useDrive((s) => s.started);
  const carBrowser = useDrive((s) => s.carBrowser);
  const sceneId = useDrive((s) => s.sceneId);
  const wheelRight = useDrive((s) => s.wheelRight);
  const muted = useDrive((s) => s.muted);
  const engineVolume = useDrive((s) => s.engineVolume);
  const musicVolume = useDrive((s) => s.musicVolume);
  const musicOn = useDrive((s) => s.musicOn);
  const trackIndex = useDrive((s) => s.trackIndex);
  const setBooted = useDrive((s) => s.setBooted);
  const startSession = useDrive((s) => s.startSession);
  const scene = sceneById(sceneId);
  const audioReady = useRef(false);

  useTheme();
  useDriveLoop();
  useGps();
  useKeys();

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      window.setTimeout(() => {
        if (!cancelled) setBooted(true);
      }, 900);
    };
    void Promise.resolve(useDrive.persist.rehydrate()).then(finish, finish);
    return () => {
      cancelled = true;
    };
  }, [setBooted]);

  useEffect(() => {
    driveEngine.setMuted(muted);
    driveEngine.setVolume(engineVolume);
    lofiPlayer.setMuted(muted);
    lofiPlayer.setVolume(musicVolume);
  }, [muted, engineVolume, musicVolume]);

  useEffect(() => {
    if (!audioReady.current) return;
    if (musicOn) {
      const track = TRACKS[trackIndex] ?? TRACKS[0]!;
      lofiPlayer.play(track);
    } else {
      lofiPlayer.stop();
    }
    return () => lofiPlayer.stop();
  }, [musicOn, trackIndex]);

  useEffect(() => {
    if (!audioReady.current) return;
    if (scene.hasMusic) {
      useDrive.getState().setMusicOn(true);
      useDrive.getState().setMusicOpen(true);
    }
  }, [scene.hasMusic, sceneId]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") driveEngine.unlock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const ignite = () => {
    const ctx = driveEngine.unlock();
    driveEngine.start();
    lofiPlayer.attach(ctx);
    audioReady.current = true;
    driveEngine.setVolume(useDrive.getState().engineVolume);
    lofiPlayer.setVolume(useDrive.getState().musicVolume);
    if (sceneById(useDrive.getState().sceneId).hasMusic) {
      useDrive.getState().setMusicOn(true);
      useDrive.getState().setMusicOpen(true);
    }
    cabinHype.attach(import.meta.env.BASE_URL || "/");
    cabinHype.prime();
    startSession();
  };

  return (
    <div
      className={wheelRight ? "vd-shell is-right" : "vd-shell"}
      style={{ "--accent": scene.accent } as React.CSSProperties}
    >
      {!booted ? (
        <div className="vd-boot">
          <span className="vd-logo vd-logo-lg" />
          <span className="vd-wordmark">VibeDrive</span>
        </div>
      ) : !started ? (
        <button type="button" className="vd-intro" onClick={ignite}>
          <span className="vd-logo vd-logo-lg" />
          <span className="vd-wordmark">VibeDrive</span>
          <span className="vd-intro-copy">Tap to ignite the cabin</span>
          <span className="vd-intro-hint">
            {carBrowser
              ? "This car's GPS drives the cabin"
              : "Open in the Tesla browser — GPS is the speed source"}
          </span>
        </button>
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
            <MusicPlayer />
          </main>
          <SettingsPanel />
        </>
      )}
    </div>
  );
}
