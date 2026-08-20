export type EngineVoice = "v8" | "i6" | "ev" | "muffled" | "space" | "synth";

export type SceneKind =
  | "night-road"
  | "neon-city"
  | "snow"
  | "desert"
  | "rain"
  | "clean-ev"
  | "space"
  | "lantern"
  | "florida"
  | "xing";

export type Scene = {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  kind: SceneKind;
  voice: EngineVoice;
  hasMusic: boolean;
  hasManual: boolean;
  idleRpm: number;
  redline: number;
  sky: [string, string];
};

export type SpeedUnit = "kmh" | "mph";
export type ThemePref = "dark" | "light" | "auto";
export type GpsStatus = "idle" | "waiting" | "live" | "denied" | "unavailable";
export type MusicTrack = {
  id: string;
  title: string;
  seed: number;
  bpm: number;
};
