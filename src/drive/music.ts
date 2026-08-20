import type { MusicTrack } from "./types";

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOTES = [110, 130.81, 146.83, 164.81, 196, 220, 246.94, 293.66];

export class LofiPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private playing = false;
  private volume = 0.45;
  private muted = false;
  private track: MusicTrack | null = null;
  private vinyl: AudioBufferSourceNode | null = null;

  attach(ctx: AudioContext) {
    this.ctx = ctx;
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);
    }
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.applyGain();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyGain();
  }

  private applyGain() {
    if (!this.master || !this.ctx) return;
    const g = this.playing && !this.muted ? this.volume * this.volume * 0.35 : 0;
    this.master.gain.setTargetAtTime(g, this.ctx.currentTime, 0.08);
  }

  play(track: MusicTrack) {
    if (!this.ctx || !this.master) return;
    this.stop();
    this.track = track;
    this.playing = true;
    this.step = 0;
    this.applyGain();
    this.startVinyl();
    this.schedule();
  }

  stop() {
    this.playing = false;
    if (this.timer != null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.vinyl) {
      try {
        this.vinyl.stop();
      } catch {
        /* already stopped */
      }
      this.vinyl = null;
    }
    this.applyGain();
  }

  isPlaying() {
    return this.playing;
  }

  private startVinyl() {
    if (!this.ctx || !this.master) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.04;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 800;
    const g = this.ctx.createGain();
    g.gain.value = 0.22;
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start();
    this.vinyl = src;
  }

  private schedule() {
    if (!this.playing || !this.ctx || !this.master || !this.track) return;
    const ctx = this.ctx;
    const stepDur = 60 / this.track.bpm / 2;
    const when = ctx.currentTime;
    const rng = mulberry32(this.track.seed + this.step * 997);
    const s = this.step % 16;

    if (s % 4 === 0) this.kick(when);
    if (s === 4 || s === 12) this.snare(when);
    if (s % 2 === 1) this.hat(when, 0.03 + rng() * 0.04);

    if (s % 8 === 0) {
      const root = NOTES[Math.floor(rng() * NOTES.length)]!;
      this.pad(when, root, stepDur * 7.5);
    }

    this.step += 1;
    this.timer = window.setTimeout(() => this.schedule(), stepDur * 1000);
  }

  private kick(when: number) {
    if (!this.ctx || !this.master) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(140, when);
    o.frequency.exponentialRampToValueAtTime(42, when + 0.12);
    g.gain.setValueAtTime(0.7, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.22);
    o.connect(g);
    g.connect(this.master);
    o.start(when);
    o.stop(when + 0.24);
  }

  private snare(when: number) {
    if (!this.ctx || !this.master) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 1200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.28, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.16);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(when);
    src.stop(when + 0.18);
  }

  private hat(when: number, dur: number) {
    if (!this.ctx || !this.master) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.08, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(when);
    src.stop(when + dur + 0.02);
  }

  private pad(when: number, freq: number, dur: number) {
    if (!this.ctx || !this.master) return;
    for (const ratio of [1, 1.25, 1.5]) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "triangle";
      o.frequency.value = freq * ratio * 0.5;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.07, when + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 900;
      o.connect(f);
      f.connect(g);
      g.connect(this.master);
      o.start(when);
      o.stop(when + dur + 0.05);
    }
  }
}

export const lofiPlayer = new LofiPlayer();
