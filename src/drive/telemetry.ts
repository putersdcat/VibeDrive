import { useDrive } from "./store";

type FleetValue = {
  stringValue?: string;
  doubleValue?: number;
  floatValue?: number;
  intValue?: number;
  value?: unknown;
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  if (v && typeof v === "object") {
    const o = v as FleetValue;
    for (const key of ["doubleValue", "floatValue", "intValue", "stringValue", "value"] as const) {
      const n = num(o[key]);
      if (n != null) return n;
    }
  }
  return null;
}

function mphToMps(mph: number) {
  return Math.max(0, mph * 0.44704);
}

function kmhToMps(kmh: number) {
  return Math.max(0, kmh / 3.6);
}

const SPEED_KEYS = new Set([
  "VehicleSpeed",
  "vehicle_speed",
  "speed",
  "Speed",
  "car_speed",
]);

function pickSpeed(obj: Record<string, unknown>, unit: "mph" | "kmh"): number | null {
  if (obj.drive_state && typeof obj.drive_state === "object") {
    const ds = obj.drive_state as Record<string, unknown>;
    const s = num(ds.speed);
    if (s != null) return mphToMps(s);
  }
  for (const k of Object.keys(obj)) {
    if (!SPEED_KEYS.has(k)) continue;
    const s = num(obj[k]);
    if (s == null) continue;
    return unit === "kmh" ? kmhToMps(s) : mphToMps(s);
  }
  return null;
}

function ingest(payload: unknown, unit: "mph" | "kmh"): number | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;

  if (Array.isArray(obj.data)) {
    for (const row of obj.data) {
      if (!row || typeof row !== "object") continue;
      const r = row as { key?: string; value?: unknown };
      if (r.key && SPEED_KEYS.has(r.key)) {
        const s = num(r.value);
        if (s != null) return unit === "kmh" ? kmhToMps(s) : mphToMps(s);
      }
    }
  }

  const nested = pickSpeed(obj, unit);
  if (nested != null) return nested;

  if (obj.payload && typeof obj.payload === "object") {
    return pickSpeed(obj.payload as Record<string, unknown>, unit);
  }
  return null;
}

class TeslaStream {
  private ws: WebSocket | null = null;
  private demoTimer: number | null = null;

  stop() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    if (this.demoTimer != null) {
      window.clearInterval(this.demoTimer);
      this.demoTimer = null;
    }
  }

  connect() {
    this.stop();
    const s = useDrive.getState();
    if (s.teslaLink === "off") {
      s.setTesla("idle", null);
      return;
    }
    if (s.teslaLink === "demo") {
      this.startDemo();
      return;
    }
    if (s.teslaLink === "tessie") {
      const vin = s.teslaVin.trim().toUpperCase();
      const token = s.teslaToken.trim();
      if (vin.length < 11 || !token) {
        s.setTesla("error", "Need VIN and Tessie token");
        return;
      }
      const url = `wss://streaming.tessie.com/${encodeURIComponent(vin)}?access_token=${encodeURIComponent(token)}`;
      this.open(url, "mph");
      return;
    }
    const url = s.teslaWsUrl.trim();
    if (!url.startsWith("wss://") && !url.startsWith("ws://")) {
      s.setTesla("error", "Need a wss:// URL");
      return;
    }
    this.open(url, s.teslaUnit);
  }

  private open(url: string, unit: "mph" | "kmh") {
    const s = useDrive.getState();
    s.setTesla("connecting", null);
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      s.setTesla("error", "Invalid WebSocket URL");
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      if (this.ws === ws) useDrive.getState().setTesla("live", null);
    };
    ws.onmessage = (ev) => {
      let data: unknown = ev.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          const n = Number(data);
          if (Number.isFinite(n)) {
            const mps = unit === "kmh" ? kmhToMps(n) : mphToMps(n);
            useDrive.getState().setTeslaSpeed(mps);
          }
          return;
        }
      }
      const mps = ingest(data, unit);
      if (mps != null) useDrive.getState().setTeslaSpeed(mps);
    };
    ws.onerror = () => {
      if (this.ws === ws) useDrive.getState().setTesla("error", "Stream failed");
    };
    ws.onclose = () => {
      if (this.ws === ws) {
        const cur = useDrive.getState();
        if (cur.teslaStatus === "live" || cur.teslaStatus === "connecting") {
          cur.setTesla("idle", "Disconnected");
        }
      }
    };
  }

  /** Cabin demo: a Tesla-shaped speed trace, no account required. */
  startDemo() {
    this.stop();
    useDrive.getState().setTesla("live", null);
    let t = 0;
    this.demoTimer = window.setInterval(() => {
      t += 0.25;
      const wave = 28 + 18 * Math.sin(t * 0.13) + 8 * Math.sin(t * 0.4);
      useDrive.getState().setTeslaSpeed(Math.max(0, wave));
    }, 120);
  }
}

export const teslaStream = new TeslaStream();
