/** Must match FRAG_FS in gl/renderer.ts */
export const HORIZON = 0.56;
export const CAM_H = 0.34;
export const PERSPECTIVE = 1.08;
export const ROAD_H = 1.58;
export const WORLD_SPEED = 0.42;

export type Projected = {
  x: number;
  y: number;
  scale: number;
  sy: number;
  z: number;
};

export function project(xw: number, z: number, w: number, h: number, yw = 0): Projected {
  const aspect = w / Math.max(h, 1);
  const zc = Math.max(z, 0.55);
  const sy = (CAM_H - yw) / zc;
  return {
    x: (0.5 + xw / (aspect * zc * PERSPECTIVE)) * w,
    y: (1 - HORIZON + sy) * h,
    scale: 1 / (aspect * zc * PERSPECTIVE),
    sy,
    z: zc,
  };
}

export function roadY(z: number, h: number) {
  return (1 - HORIZON + CAM_H / Math.max(z, 0.55)) * h;
}
