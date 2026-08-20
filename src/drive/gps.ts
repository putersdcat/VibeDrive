import { detectTeslaBrowser, haversineM } from "./car";
import { useDrive } from "./store";

type Fix = { lat: number; lon: number; at: number };

let active = false;

const TIGHT = { enableHighAccuracy: true, maximumAge: 800, timeout: 20_000 };
const LOOSE = { enableHighAccuracy: false, maximumAge: 4_000, timeout: 25_000 };

export function startGpsWatch(): () => void {
  if (active) return () => undefined;
  if (!("geolocation" in navigator)) {
    useDrive.getState().setGps("unavailable", 0, false);
    return () => undefined;
  }
  active = true;
  useDrive.getState().setGps("waiting", 0, false);
  let last: Fix | null = null;

  const onFix = (pos: GeolocationPosition) => {
    const now = Date.now();
    const raw = pos.coords.speed;
    const native = typeof raw === "number" && Number.isFinite(raw) && raw >= 0;
    let mps = 0;
    if (native) mps = raw;
    else if (last) {
      const dt = (now - last.at) / 1000;
      if (dt >= 0.2) {
        mps = haversineM(last, { lat: pos.coords.latitude, lon: pos.coords.longitude }) / dt;
      } else {
        mps = useDrive.getState().gpsSpeedMps;
      }
    }
    last = { lat: pos.coords.latitude, lon: pos.coords.longitude, at: now };
    useDrive.getState().setGps("live", Math.max(0, mps), native);
  };

  const onErr = (err: GeolocationPositionError) => {
    if (err.code === 1) {
      useDrive.getState().setGps("denied", 0, false);
      return;
    }
    navigator.geolocation.getCurrentPosition(onFix, () => undefined, LOOSE);
  };

  navigator.geolocation.getCurrentPosition(onFix, onErr, TIGHT);
  const id = navigator.geolocation.watchPosition(onFix, onErr, TIGHT);
  const poll = window.setInterval(() => {
    navigator.geolocation.getCurrentPosition(onFix, () => undefined, LOOSE);
  }, 1500);

  return () => {
    active = false;
    navigator.geolocation.clearWatch(id);
    window.clearInterval(poll);
  };
}

export function applyCarBrowserDefaults() {
  const car = detectTeslaBrowser();
  useDrive.getState().setCarBrowser(car);
  if (car) useDrive.getState().setSimulate(false);
}
