/** Tesla in-car Chromium / QtWebEngine. UA strings vary a lot by MCU year. */
export function detectTeslaBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/tesla|qtcarbrowser|teslabrowser/i.test(ua)) return true;
  if (/QtWebEngine/i.test(ua) && /linux/i.test(ua)) return true;
  const linux = /Linux/i.test(ua) && /X11|GNU/i.test(ua);
  const phone = /android|iphone|ipad|windows|macintosh|cros/i.test(ua);
  if (linux && !phone && (navigator.maxTouchPoints || 0) > 0) return true;
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
