const imageLoads = new Map<string, Promise<HTMLImageElement>>();

export function loadImageAsset(url: string, timeoutMs = 15000): Promise<HTMLImageElement> {
  const cached = imageLoads.get(url);
  if (cached) return cached;

  const load = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    let settled = false;
    const timer = window.setTimeout(() => finish(new Error(`Image timeout: ${url}`)), timeoutMs);

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      if (error || !image.naturalWidth) {
        reject(error ?? new Error(`Image failed: ${url}`));
        return;
      }
      const decoded =
        typeof image.decode === "function" ? image.decode().catch(() => undefined) : Promise.resolve();
      void decoded.then(() => resolve(image));
    };

    image.decoding = "async";
    image.onload = () => finish();
    image.onerror = () => finish(new Error(`Image failed: ${url}`));
    image.src = url;
    if (image.complete) queueMicrotask(() => finish());
  });

  imageLoads.set(url, load);
  return load;
}

export function assetRoot(base: string): string {
  return base.replace(/\/?$/, "/");
}