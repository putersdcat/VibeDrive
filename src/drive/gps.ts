import { detectTeslaBrowser, haversineM } from "./car";
import { useDrive } from "./store";

type Fix = { lat: number; lon: number; at: number };

export function startGpsWatch(): () => void {
  if (!detectTeslaBrowser()) {
    return () => undefined;
  }
  if (!("geolocation" in navigator)) {
    useDrive.getState().setGps("unavailable", 0);
    return () => undefined;
  }
  useDrive.getState().setGps("waiting", 0);
  let last: Fix | null = null;

  const id = navigator.geolocation.watchPosition(
    (pos) => {
      const now = Date.now();
      const raw = pos.coords.speed;
      let mps = 0;
      if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
        mps = raw;
      } else if (last) {
        const dt = (now - last.at) / 1000;
        if (dt >= 0.15) {
          mps = haversineM(last, { lat: pos.coords.latitude, lon: pos.coords.longitude }) / dt;
        } else {
          mps = useDrive.getState().gpsSpeedMps;
        }
      }
      last = { lat: pos.coords.latitude, lon: pos.coords.longitude, at: now };
      useDrive.getState().setGps("live", Math.max(0, mps));
    },
    (err) => {
      last = null;
      useDrive.getState().setGps(err.code === 1 ? "denied" : "unavailable", 0);
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
  );

  return () => {
    navigator.geolocation.clearWatch(id);
  };
}

export function applyCarBrowserDefaults() {
  const car = detectTeslaBrowser();
  useDrive.getState().setCarBrowser(car);
  if (car) useDrive.getState().setSimulate(false);
}
