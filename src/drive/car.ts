/** Tesla in-car browser (QtWebEngine / TeslaBrowser). No special vehicle API. */
export function detectTeslaBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/tesla|qtcarbrowser|teslabrowser/i.test(ua)) return true;
  const qt = /QtWebEngine/i.test(ua);
  const x11linux = /X11/i.test(ua) && /Linux/i.test(ua);
  const desk =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if ((qt || x11linux) && !desk && !/android/i.test(ua)) return true;
  return false;
}

export function haversineM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6_371_000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLon = toR(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
