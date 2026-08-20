import type { Scene } from "./types";

export const SCENES: Scene[] = [
  {
    id: "citrus-gator",
    name: "Citrus Gator",
    tagline: "Sunny I-95. Gators. It rains bananas.",
    accent: "#f4c430",
    kind: "florida",
    voice: "ev",
    hasManual: false,
    idleRpm: 0,
    redline: 18000,
    sky: ["#1ea0ff", "#ffe9a0"],
  },
  {
    id: "copper-wash",
    name: "Copper Wash",
    tagline: "Dusty torque, heat-soaked and grainy.",
    accent: "#e08a2a",
    kind: "desert",
    voice: "v8",
    hasManual: true,
    idleRpm: 700,
    redline: 6200,
    sky: ["#6a2e0e", "#f2c07a"],
  },
  {
    id: "white-pass",
    name: "White Pass",
    tagline: "A pinched six in thin mountain air.",
    accent: "#8fc7ea",
    kind: "snow",
    voice: "i6",
    hasManual: true,
    idleRpm: 850,
    redline: 7400,
    sky: ["#9eb8cc", "#eef4fa"],
  },
  {
    id: "paper-lantern",
    name: "Paper Lantern",
    tagline: "Pagoda dusk, petals on the tarmac.",
    accent: "#ff7eb6",
    kind: "lantern",
    voice: "i6",
    hasManual: true,
    idleRpm: 820,
    redline: 7600,
    sky: ["#140814", "#6a2040"],
  },
];

export const DEFAULT_SCENE_ID = "citrus-gator";

export function sceneById(id: string): Scene {
  return SCENES.find((s) => s.id === id) ?? SCENES[0]!;
}
