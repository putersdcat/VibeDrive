import type { EngineVoice } from "./types";

function noiseBuffer(ctx: AudioContext, seconds = 1.5): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export class DriveEngine {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private oscA: OscillatorNode | null = null;
  private oscB: OscillatorNode | null = null;
  private oscC: OscillatorNode | null = null;
  private rumble: OscillatorNode | null = null;
  private noise: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private started = false;
  private muted = false;
  private volume = 0.7;

  unlock(): AudioContext {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC({ latencyHint: "interactive" });
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  start() {
    const ctx = this.unlock();
    if (this.started) return;
    this.started = true;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume * this.volume;
    this.master.connect(ctx.destination);

    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0.0001;
    this.engineGain.connect(this.master);

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 400;
    this.filter.Q.value = 0.8;
    this.filter.connect(this.engineGain);

    this.oscA = ctx.createOscillator();
    this.oscA.type = "sawtooth";
    this.oscA.frequency.value = 40;
    const gA = ctx.createGain();
    gA.gain.value = 0.22;
    this.oscA.connect(gA);
    gA.connect(this.filter);

    this.oscB = ctx.createOscillator();
    this.oscB.type = "sawtooth";
    this.oscB.frequency.value = 41.2;
    const gB = ctx.createGain();
    gB.gain.value = 0.18;
    this.oscB.connect(gB);
    gB.connect(this.filter);

    this.oscC = ctx.createOscillator();
    this.oscC.type = "square";
    this.oscC.frequency.value = 80;
    const gC = ctx.createGain();
    gC.gain.value = 0.05;
    this.oscC.connect(gC);
    gC.connect(this.filter);

    this.rumble = ctx.createOscillator();
    this.rumble.type = "sine";
    this.rumble.frequency.value = 28;
    const gR = ctx.createGain();
    gR.gain.value = 0.12;
    this.rumble.connect(gR);
    gR.connect(this.engineGain);

    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = "bandpass";
    this.noiseFilter.frequency.value = 220;
    this.noiseFilter.Q.value = 0.7;
    const gN = ctx.createGain();
    gN.gain.value = 0.08;
    this.noiseFilter.connect(gN);
    gN.connect(this.filter);

    this.noise = ctx.createBufferSource();
    this.noise.buffer = noiseBuffer(ctx);
    this.noise.loop = true;
    this.noise.connect(this.noiseFilter);

    this.oscA.start();
    this.oscB.start();
    this.oscC.start();
    this.rumble.start();
    this.noise.start();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(
        muted ? 0 : this.volume * this.volume,
        this.ctx.currentTime,
        0.04,
      );
    }
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx && !this.muted) {
      this.master.gain.setTargetAtTime(this.volume * this.volume, this.ctx.currentTime, 0.04);
    }
  }

  set(rpm: number, load: number, voice: EngineVoice, idleRpm: number) {
    if (!this.ctx || !this.started || !this.filter || !this.oscA || !this.oscB || !this.oscC || !this.rumble || !this.engineGain || !this.noiseFilter) {
      return;
    }
    const t = this.ctx.currentTime;
    const running = rpm > 30;
    const norm = Math.max(0, rpm);
    let fund = 40;
    let detune = 1.03;
    let metal = 2;
    let cutoff = 280 + load * 2400 + (norm / 8000) * 1800;
    let noiseAmt = 0.05 + load * 0.12;
    let body = 0.16 + load * 0.22;
    let rumbleHz = 22 + (norm / 8000) * 18;

    if (voice === "v8") {
      fund = Math.max(28, (norm / 60) * 0.5);
      detune = 1.045;
      metal = 2.02;
      rumbleHz = 18 + (norm / 60) * 0.12;
    } else if (voice === "i6") {
      fund = Math.max(32, (norm / 60) * 0.55);
      detune = 1.018;
      metal = 3;
      cutoff *= 1.15;
      noiseAmt *= 0.7;
    } else if (voice === "ev") {
      fund = 80 + (norm / 18000) * 1400;
      detune = 1.002;
      metal = 2;
      cutoff = 1800 + (norm / 18000) * 6000;
      body = 0.06 + load * 0.1;
      noiseAmt = 0.02 + load * 0.04;
      rumbleHz = 40;
    } else if (voice === "synth") {
      fund = Math.max(40, (norm / 60) * 0.7);
      detune = 1.08;
      metal = 1.5;
      cutoff = 420 + load * 3200 + (norm / 8000) * 2400;
    } else if (voice === "muffled") {
      fund = Math.max(26, (norm / 60) * 0.42);
      detune = 1.03;
      metal = 2;
      cutoff = 180 + load * 900;
      body *= 0.7;
      noiseAmt *= 0.5;
    } else if (voice === "space") {
      fund = 55 + (norm / 14000) * 900;
      detune = 1.012;
      metal = 1.333;
      cutoff = 900 + (norm / 14000) * 4200;
      body = 0.1 + load * 0.12;
      rumbleHz = 12;
    }

    const idleBoost = rpm < idleRpm + 80 && voice !== "ev" && voice !== "space" ? 0.04 : 0;
    const targetGain = running ? Math.min(0.55, body + idleBoost) : 0.0001;

    this.oscA.frequency.setTargetAtTime(fund, t, 0.04);
    this.oscB.frequency.setTargetAtTime(fund * detune, t, 0.04);
    this.oscC.frequency.setTargetAtTime(fund * metal, t, 0.05);
    this.rumble.frequency.setTargetAtTime(rumbleHz, t, 0.05);
    this.filter.frequency.setTargetAtTime(Math.max(120, Math.min(9000, cutoff)), t, 0.05);
    this.noiseFilter.frequency.setTargetAtTime(160 + load * 900 + fund * 0.4, t, 0.06);
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.05);
  }
}

export const driveEngine = new DriveEngine();
