//! High-rate particle / dash sim for the VibeDrive WebGL cabin.
//! No allocator in the tick path — static buffers, C ABI, loads as raw WASM.

#![allow(clippy::missing_safety_doc)]

const MAX: usize = 2048;
const STRIDE: usize = 4; // x, y, vx, kind

static mut PARTS: [f32; MAX * STRIDE] = [0.0; MAX * STRIDE];
static mut COUNT: u32 = 0;
static mut SEEDED: bool = false;
static mut RNG: u32 = 0xC0FFEE;

#[inline]
fn rng() -> f32 {
    unsafe {
        RNG = RNG.wrapping_mul(1664525).wrapping_add(1013904223);
        (RNG >> 8) as f32 / 16_777_216.0
    }
}

#[no_mangle]
pub extern "C" fn vd_init(seed: u32) {
    unsafe {
        RNG = if seed == 0 { 0xA5A5A5A5 } else { seed };
        SEEDED = true;
        COUNT = MAX as u32;
        for i in 0..MAX {
            let o = i * STRIDE;
            PARTS[o] = rng() * 2.0 - 1.0;
            PARTS[o + 1] = rng();
            PARTS[o + 2] = 0.35 + rng() * 1.4;
            PARTS[o + 3] = (i % 5) as f32;
        }
    }
}

#[no_mangle]
pub extern "C" fn vd_particles_ptr() -> *const f32 {
    unsafe { PARTS.as_ptr() }
}

#[no_mangle]
pub extern "C" fn vd_particles_count() -> u32 {
    unsafe { COUNT }
}

/// kind: 0 night, 1 neon, 2 snow, 3 desert, 4 rain, 5 ev, 6 space, 7 lantern
#[no_mangle]
pub extern "C" fn vd_tick(dt: f32, speed_mps: f32, kind: u32, time: f32) -> u32 {
    unsafe {
        if !SEEDED {
            vd_init(1);
        }
        let dt = dt.clamp(0.0, 0.05);
        let rush = 0.08 + speed_mps * 0.018;
        for i in 0..MAX {
            let o = i * STRIDE;
            let k = PARTS[o + 3] as u32;
            match kind {
                2 => {
                    // snow: drift down
                    PARTS[o + 1] += dt * (0.04 + PARTS[o + 2] * 0.08);
                    PARTS[o] += (time * 0.7 + i as f32 * 0.13).sin() * dt * 0.08;
                }
                4 => {
                    // rain: streak down-right
                    PARTS[o + 1] += dt * (1.4 + rush * 2.2) * PARTS[o + 2];
                    PARTS[o] += dt * 0.25;
                }
                3 => {
                    // dust: sideways
                    PARTS[o] += dt * (0.35 + rush) * PARTS[o + 2];
                }
                7 => {
                    // petals
                    PARTS[o + 1] += dt * (0.06 + PARTS[o + 2] * 0.05);
                    PARTS[o] += (time * 0.9 + k as f32).sin() * dt * 0.12;
                }
                6 => {
                    // stars: slow drift
                    PARTS[o] += dt * 0.02 * PARTS[o + 2];
                }
                _ => {
                    PARTS[o + 1] += dt * rush * PARTS[o + 2];
                }
            }
            if PARTS[o + 1] > 1.2 || PARTS[o] > 1.4 || PARTS[o] < -1.4 {
                PARTS[o] = rng() * 2.0 - 1.0;
                PARTS[o + 1] = -0.05 - rng() * 0.2;
                PARTS[o + 2] = 0.35 + rng() * 1.4;
            }
        }
        COUNT
    }
}

/// Perspective dash positions: writes 32 y-values + widths into a tiny buffer.
static mut DASH: [f32; 64] = [0.0; 64];

#[no_mangle]
pub extern "C" fn vd_dash_ptr() -> *const f32 {
    unsafe { DASH.as_ptr() }
}

#[no_mangle]
pub extern "C" fn vd_dash_fill(offset: f32, count: u32) -> u32 {
    let n = count.min(32) as usize;
    unsafe {
        for i in 0..n {
            let z = (i as f32 / n as f32 + offset).fract();
            let p = z * z;
            DASH[i * 2] = p;
            DASH[i * 2 + 1] = 0.004 + 0.03 * p;
        }
    }
    n as u32
}

#[no_mangle]
pub extern "C" fn vd_memory_size() -> u32 {
    unsafe { (PARTS.len() + DASH.len()) as u32 }
}
