export const GEAR_RATIOS = [3.82, 2.2, 1.52, 1.22, 1.02, 0.82];
const FINAL_DRIVE = 3.42;
const TIRE_CIRCUM_M = 2.05;

export function rpmFromSpeed(speedMps: number, gear: number, idleRpm: number, redline: number): number {
  if (speedMps < 0.4) return idleRpm;
  const ratio = GEAR_RATIOS[Math.max(0, Math.min(GEAR_RATIOS.length - 1, gear - 1))] ?? 1;
  const wheelRps = speedMps / TIRE_CIRCUM_M;
  const rpm = wheelRps * 60 * ratio * FINAL_DRIVE;
  return Math.max(idleRpm, Math.min(redline + 400, rpm));
}

export function autoGearForSpeed(speedMps: number, current: number, rpm: number, redline: number, idleRpm: number): number {
  let gear = current;
  if (rpm > redline * 0.88 && gear < 6) gear += 1;
  else if (rpm < idleRpm + (redline - idleRpm) * 0.18 && gear > 1 && speedMps > 1) gear -= 1;
  if (speedMps < 1.5) gear = 1;
  return gear;
}

export function speedForRpm(rpm: number, gear: number): number {
  const ratio = GEAR_RATIOS[Math.max(0, Math.min(GEAR_RATIOS.length - 1, gear - 1))] ?? 1;
  const wheelRps = rpm / (60 * ratio * FINAL_DRIVE);
  return wheelRps * TIRE_CIRCUM_M;
}
