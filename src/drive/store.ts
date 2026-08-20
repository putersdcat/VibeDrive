import { create } from "zustand";
import { persist } from "zustand/middleware";
import { detectTeslaBrowser } from "./car";
import { DEFAULT_SCENE_ID, TRACKS, sceneById } from "./scenes";
import { autoGearForSpeed, rpmDirectDrive, rpmFromSpeed } from "./gearbox";
import type { GpsStatus, SpeedUnit, ThemePref } from "./types";

const LS_KEY = "vibedrive:v4";

export type CabinSource = "sim" | "gps" | "pin" | "demo";

type DriveState = {
  booted: boolean;
  started: boolean;
  sceneId: string;
  unit: SpeedUnit;
  theme: ThemePref;
  engineVolume: number;
  musicVolume: number;
  muted: boolean;
  hudHidden: boolean;
  dockOpen: boolean;
  settingsOpen: boolean;
  musicOpen: boolean;
  wheelRight: boolean;
  isManual: boolean;
  gear: number;
  shiftFlash: number;
  gpsStatus: GpsStatus;
  gpsSpeedMps: number;
  carBrowser: boolean;
  simSpeedMps: number;
  demoOn: boolean;
  demoT: number;
  source: CabinSource;
  speedMps: number;
  accelMs2: number;
  load: number;
  rpm: number;
  throttle: boolean;
  brake: boolean;
  pinSpeed: boolean;
  pinnedKmh: number;
  simulate: boolean;
  trackIndex: number;
  musicOn: boolean;
  hypeOn: boolean;
  fps: number;
  setBooted: (v: boolean) => void;
  startSession: () => void;
  setScene: (id: string) => void;
  setUnit: (u: SpeedUnit) => void;
  setTheme: (t: ThemePref) => void;
  setEngineVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setMuted: (v: boolean) => void;
  setHudHidden: (v: boolean) => void;
  setDockOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setMusicOpen: (v: boolean) => void;
  setWheelRight: (v: boolean) => void;
  setManual: (v: boolean) => void;
  shift: (dir: 1 | -1) => void;
  setThrottle: (v: boolean) => void;
  setBrake: (v: boolean) => void;
  setPinSpeed: (v: boolean) => void;
  setPinnedKmh: (v: number) => void;
  setSimulate: (v: boolean) => void;
  setGps: (status: GpsStatus, speedMps: number | null) => void;
  setCarBrowser: (v: boolean) => void;
  setDemoOn: (v: boolean) => void;
  setFps: (v: number) => void;
  nextTrack: (delta: number) => void;
  setMusicOn: (v: boolean) => void;
  setHypeOn: (v: boolean) => void;
  tick: (dt: number) => void;
};

export const useDrive = create<DriveState>()(
  persist(
    (set, get) => ({
      booted: false,
      started: false,
      sceneId: DEFAULT_SCENE_ID,
      unit: "kmh",
      theme: "dark",
      engineVolume: 0.68,
      musicVolume: 0.42,
      muted: false,
      hudHidden: false,
      dockOpen: true,
      settingsOpen: false,
      musicOpen: false,
      wheelRight: false,
      isManual: false,
      gear: 1,
      shiftFlash: 0,
      gpsStatus: "idle",
      gpsSpeedMps: 0,
      carBrowser: typeof navigator !== "undefined" && detectTeslaBrowser(),
      simSpeedMps: 0,
      demoOn: false,
      demoT: 0,
      source: "sim",
      speedMps: 0,
      accelMs2: 0,
      load: 0,
      rpm: 780,
      throttle: false,
      brake: false,
      pinSpeed: false,
      pinnedKmh: 90,
      simulate: false,
      trackIndex: 0,
      musicOn: false,
      hypeOn: true,
      fps: 0,
      setBooted: (v) => set({ booted: v }),
      startSession: () => set({ started: true }),
      setScene: (id) => {
        const scene = sceneById(id);
        set({
          sceneId: id,
          isManual: scene.hasManual ? get().isManual : false,
          gear: 1,
        });
      },
      setUnit: (unit) => set({ unit }),
      setTheme: (theme) => set({ theme }),
      setEngineVolume: (engineVolume) => set({ engineVolume }),
      setMusicVolume: (musicVolume) => set({ musicVolume }),
      setMuted: (muted) => set({ muted }),
      setHudHidden: (hudHidden) => set({ hudHidden }),
      setDockOpen: (dockOpen) => set({ dockOpen }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setMusicOpen: (musicOpen) => set({ musicOpen }),
      setWheelRight: (wheelRight) => set({ wheelRight }),
      setManual: (isManual) => {
        const scene = sceneById(get().sceneId);
        if (!scene.hasManual) return;
        set({ isManual });
      },
      shift: (dir) => {
        const s = get();
        const scene = sceneById(s.sceneId);
        if (!s.isManual || !scene.hasManual) return;
        const gear = Math.max(1, Math.min(6, s.gear + dir));
        set({ gear, shiftFlash: 0.28 });
      },
      setThrottle: (throttle) => set({ throttle }),
      setBrake: (brake) => set({ brake }),
      setPinSpeed: (pinSpeed) => set({ pinSpeed }),
      setPinnedKmh: (pinnedKmh) => set({ pinnedKmh }),
      setSimulate: (simulate) => set({ simulate }),
      setGps: (gpsStatus, speedMps) => set({ gpsStatus, gpsSpeedMps: speedMps ?? 0 }),
      setCarBrowser: (carBrowser) => set({ carBrowser }),
      setDemoOn: (demoOn) => set({ demoOn, demoT: demoOn ? get().demoT : 0 }),
      setFps: (fps) => set({ fps }),
      nextTrack: (delta) =>
        set((s) => ({
          trackIndex: (s.trackIndex + delta + TRACKS.length) % TRACKS.length,
        })),
      setMusicOn: (musicOn) => set({ musicOn }),
      setHypeOn: (hypeOn) => set({ hypeOn }),
      tick: (dt) => {
        const s = get();
        const scene = sceneById(s.sceneId);
        const gpsLive = s.gpsStatus === "live" && !s.simulate;
        let next = s.simSpeedMps;
        let load = 0;
        let source: CabinSource = "sim";
        let demoT = s.demoT;

        if (s.pinSpeed) {
          source = "pin";
          const target = s.pinnedKmh / 3.6;
          const delta = target - next;
          next += delta * Math.min(1, dt * 1.8);
          load = Math.min(1, Math.abs(delta) / 12 + 0.12);
        } else if (gpsLive) {
          source = "gps";
          const target = s.gpsSpeedMps;
          const delta = target - next;
          next += delta * Math.min(1, dt * 8);
          load = Math.min(1, Math.max(0, Math.abs(delta) / 8 + 0.08));
        } else if (s.demoOn && !s.carBrowser) {
          source = "demo";
          demoT += dt;
          const wave = 28 + 18 * Math.sin(demoT * 0.13) + 8 * Math.sin(demoT * 0.4);
          const target = Math.max(0, wave);
          const delta = target - next;
          next += delta * Math.min(1, dt * 2.2);
          load = Math.min(1, Math.max(0.08, Math.abs(delta) / 8 + target / 70));
        } else if (s.carBrowser && !s.simulate) {
          source = "gps";
          next = Math.max(0, next - (2.2 + next * 0.18) * dt);
          load = next > 1 ? 0.1 : 0;
        } else {
          const max = 62;
          if (s.throttle) {
            const pull = 9.5 - next * 0.08;
            next += Math.max(1.6, pull) * dt;
            load = Math.min(1, 0.35 + next / 90);
          } else if (s.brake) {
            next -= 14 * dt;
            load = 0.08;
          } else {
            next -= (2.2 + next * 0.12) * dt;
            load = next > 1 ? 0.12 : 0;
          }
          next = Math.max(0, Math.min(max, next));
        }

        const accel = (next - s.speedMps) / Math.max(dt, 0.001);
        let gear = 1;
        let rpm: number;
        if (scene.hasManual) {
          gear = s.gear;
          rpm = rpmFromSpeed(next, gear, scene.idleRpm, scene.redline);
          if (!s.isManual) {
            gear = autoGearForSpeed(next, gear, rpm, scene.redline, scene.idleRpm);
            rpm = rpmFromSpeed(next, gear, scene.idleRpm, scene.redline);
          }
        } else {
          rpm = rpmDirectDrive(next, scene.idleRpm, scene.redline);
        }
        if (next < 0.35) {
          rpm = scene.idleRpm;
          gear = 1;
          load = s.throttle ? 0.22 : 0.04;
        }

        set({
          simSpeedMps: next,
          speedMps: next,
          accelMs2: accel,
          load,
          rpm,
          gear,
          source,
          demoT,
          shiftFlash: Math.max(0, s.shiftFlash - dt),
        });
      },
    }),
    {
      name: LS_KEY,
      skipHydration: true,
      partialize: (s) => ({
        sceneId: s.sceneId,
        unit: s.unit,
        theme: s.theme,
        engineVolume: s.engineVolume,
        musicVolume: s.musicVolume,
        hudHidden: s.hudHidden,
        wheelRight: s.wheelRight,
        pinnedKmh: s.pinnedKmh,
        trackIndex: s.trackIndex,
        dockOpen: s.dockOpen,
        hypeOn: s.hypeOn,
      }),
    },
  ),
);

export function displaySpeed(mps: number, unit: SpeedUnit): number {
  const v = unit === "mph" ? mps * 2.236936 : mps * 3.6;
  return Math.max(0, Math.round(v));
}
