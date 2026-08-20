export type WasmCore = {
  memory: WebAssembly.Memory;
  vd_init: (seed: number) => void;
  vd_tick: (dt: number, speed: number, kind: number, time: number) => number;
  vd_particles_ptr: () => number;
  vd_particles_count: () => number;
  particles: () => Float32Array;
};

let core: WasmCore | null = null;
let loading: Promise<WasmCore | null> | null = null;

function wrap(exports: WebAssembly.Exports): WasmCore {
  const memory = exports.memory as WebAssembly.Memory;
  const vd_particles_ptr = exports.vd_particles_ptr as () => number;
  const vd_particles_count = exports.vd_particles_count as () => number;
  const vd_init = exports.vd_init as (s: number) => void;
  const vd_tick = exports.vd_tick as (a: number, b: number, c: number, d: number) => number;
  vd_init(0xc0ffee);
  return {
    memory,
    vd_init,
    vd_tick,
    vd_particles_ptr,
    vd_particles_count,
    particles: () => {
      const ptr = vd_particles_ptr();
      const n = vd_particles_count();
      return new Float32Array(memory.buffer, ptr, n * 4);
    },
  };
}

export function getWasm(): WasmCore | null {
  return core;
}

export function loadWasm(base = "/"): Promise<WasmCore | null> {
  if (core) return Promise.resolve(core);
  if (loading) return loading;
  const url = `${base.replace(/\/?$/, "/")}vibedrive_core.wasm`;
  loading = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`wasm ${res.status}`);
      const buf = await res.arrayBuffer();
      const result = await WebAssembly.instantiate(buf, {});
      core = wrap(result.instance.exports);
      return core;
    } catch {
      core = null;
      return null;
    }
  })();
  return loading;
}

export const KIND_INDEX: Record<string, number> = {
  "night-road": 0,
  "neon-city": 1,
  snow: 2,
  desert: 3,
  rain: 4,
  "clean-ev": 5,
  space: 6,
  lantern: 7,
};
