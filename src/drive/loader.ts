import { loadImageAsset, assetRoot } from "./assets";
import { cabinHype, HYPE_LINE_COUNT } from "./callouts";
import { loadTributeSprites, SPRITE_NAMES } from "./canvas/tribute";
import { SCENES } from "./scenes";
import { loadWasm, type WasmCore } from "./wasm";

export type RuntimeProgress = {
  progress: number;
  detail: string;
};

export type RuntimeAssets = {
  wasm: WasmCore | null;
};

export async function loadDriveRuntime(
  base: string,
  onProgress: (status: RuntimeProgress) => void,
): Promise<RuntimeAssets> {
  const root = assetRoot(base);
  const total = 1 + SCENES.length + SPRITE_NAMES.length + HYPE_LINE_COUNT;
  let completed = 0;

  const report = (detail: string) => {
    completed += 1;
    onProgress({
      progress: Math.min(0.96, 0.04 + (completed / total) * 0.92),
      detail,
    });
  };

  onProgress({ progress: 0.04, detail: "Warming the Rust driving core…" });
  cabinHype.attach(root);

  const wasmTask = loadWasm(root).then((wasm) => {
    report(wasm ? "Driving core online" : "Canvas fallback ready");
    return wasm;
  });

  const skiesTask = Promise.all(
    SCENES.map(async (scene) => {
      try {
        await loadImageAsset(`${root}skies/${scene.kind}.jpg`);
      } catch {
        // The renderer has a gradient fallback for a missing sky plate.
      } finally {
        report("Loading cinematic sky plates…");
      }
    }),
  );

  const spritesTask = loadTributeSprites(root, () => report("Loading roadside artwork…")).catch(() => undefined);
  const audioTask = cabinHype.primeAsync(() => report("Preparing cabin audio…")).catch(() => undefined);

  const [wasm] = await Promise.all([wasmTask, skiesTask, spritesTask, audioTask]);
  onProgress({
    progress: 1,
    detail: wasm ? "Cabin ready" : "Cabin ready · fallback renderer",
  });
  return { wasm };
}