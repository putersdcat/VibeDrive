import type { Scene } from "../types";
import { assetRoot, loadImageAsset } from "../assets";
import { getWasm, KIND_INDEX, loadWasm, type WasmCore } from "../wasm";

const VERT_FS = `#version 300 es
precision highp float;
const vec2 POS[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main(){ gl_Position = vec4(POS[gl_VertexID], 0.0, 1.0); }
`;

const VERT_PT = `#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec4 a;
uniform vec2 uRes;
uniform int uKind;
uniform int uLimit;
out float vKind;
out float vNear;
void main(){
  if (gl_VertexID >= uLimit) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    gl_PointSize = 0.0;
    vKind = 0.0;
    vNear = 0.0;
    return;
  }
  float depth = clamp(a.y, 0.0, 1.12);
  float persp = depth * depth;
  float aspect = uRes.x / max(uRes.y, 1.0);
  float spread = mix(0.14, 1.72, persp);
  float x = a.x * spread / aspect;
  float top = uKind == 3 ? 0.18 : 0.94;
  float y = mix(top, -1.04, persp);
  gl_Position = vec4(x, y, 0.0, 1.0);
  float ps = mix(1.0, 5.6, persp) * (0.55 + a.z * 0.34) * (uRes.y / 720.0);
  if (uKind == 2) ps *= 0.78;
  if (uKind == 3) ps *= 0.64;
  if (uKind == 4) ps *= 0.62;
  if (uKind == 7) ps *= 0.82;
  gl_PointSize = max(1.0, ps);
  vKind = a.w;
  vNear = persp;
}
`;

const FRAG_PT = `#version 300 es
precision highp float;
precision highp int;
uniform vec3 uAccent;
uniform int uKind;
in float vKind;
in float vNear;
out vec4 frag;
void main(){
  vec2 pc = gl_PointCoord * 2.0 - 1.0;
  float d = dot(pc, pc);
  if (uKind == 4) {
    if (abs(pc.x) > 0.2 || abs(pc.y) > 1.0) discard;
    frag = vec4(0.78, 0.86, 0.92, 0.42);
    return;
  }
  if (d > 1.0) discard;
  vec3 c = uAccent;
  if (uKind == 2) c = vec3(0.94, 0.98, 1.0);
  if (uKind == 3) c = vec3(0.82, 0.55, 0.24);
  if (uKind == 6) c = vec3(0.85, 0.93, 1.0);
  if (uKind == 7) c = mix(uAccent, vec3(1.0, 0.82, 0.90), 0.45);
  float alpha = mix(0.12, 0.74, vNear) * (1.0 - d);
  frag = vec4(c, alpha);
}
`;

const FRAG_FS = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uRes;
uniform float uTime;
uniform float uSpeed;
uniform float uLoad;
uniform vec3 uAccent;
uniform vec3 uSky0;
uniform vec3 uSky1;
uniform int uKind;
uniform sampler2D uSky;
uniform float uHasSky;
uniform float uScroll;
uniform float uShake;
uniform float uBump;
out vec4 frag;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float n2(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

vec3 terrain(int k, float band){
  if (k==2) return mix(vec3(0.86,0.90,0.93), vec3(0.72,0.80,0.86), band);
  if (k==3) return mix(vec3(0.78,0.48,0.18), vec3(0.93,0.66,0.28), band);
  if (k==8) return mix(vec3(0.22,0.50,0.18), vec3(0.40,0.62,0.16), band);
  if (k==5) return mix(vec3(0.70,0.76,0.74), vec3(0.52,0.60,0.58), band);
  if (k==6) return mix(vec3(0.05,0.05,0.14), vec3(0.12,0.08,0.24), band);
  if (k==7) return mix(vec3(0.16,0.05,0.10), vec3(0.28,0.08,0.16), band);
  if (k==1) return mix(vec3(0.05,0.02,0.10), vec3(0.12,0.04,0.16), band);
  return mix(vec3(0.07,0.09,0.07), vec3(0.13,0.16,0.10), band);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / max(uRes.y, 1.0);
  uv.x += 0.0018 * uLoad * sin(uTime * 31.0) + uShake * 0.016 * sin(uTime * 63.0);
  uv.y += uBump * 0.026 + uShake * 0.009 * sin(uTime * 81.0);
  float horizon = 0.56 + uBump * 0.04;

  if (uv.y >= horizon) {
    frag = vec4(0.0);
    return;
  }

  vec3 horCol = uSky1;
  vec3 sunC = mix(uAccent, vec3(1.0, 0.86, 0.55), 0.4);
  if (uKind == 8) sunC = vec3(1.00, 0.90, 0.45);
  else if (uKind == 3) sunC = vec3(1.00, 0.72, 0.22);
  else if (uKind == 2) sunC = vec3(0.95, 0.97, 1.00);
  else if (uKind == 5) sunC = vec3(1.00, 0.94, 0.78);
  else if (uKind == 7) sunC = vec3(1.00, 0.50, 0.68);
  else if (uKind == 6) sunC = uAccent;
  else if (uKind == 0 || uKind == 4 || uKind == 9) sunC = vec3(1.00, 0.62, 0.28);
  vec3 col = horCol;

  if (uv.y < horizon) {
    float sy = max(horizon - uv.y, 0.00055);
    float z = 0.34 / sy;
    float xw = (uv.x - 0.5) * aspect * z * 1.08;
    float ax = abs(xw);
    float roadH = 1.58;
    float shoulder = 0.52;
    float band = fract(z * 0.20 + uScroll);

    vec3 ground = terrain(uKind, step(0.5, band));
    if (uKind == 8 && xw < -2.6) {
      ground = mix(vec3(0.08, 0.38, 0.55), vec3(0.18, 0.62, 0.70), 0.5 + 0.5 * sin(xw * 1.6 + uTime));
    }
    col = ground;

    if (ax < roadH + shoulder + 0.15) {
      if (ax > roadH && ax < roadH + shoulder) {
        float rum = step(0.5, fract(z * 1.65 + uScroll * 0.55 + floor((xw + 8.0) * 3.4)));
        vec3 ra = uKind == 2 ? vec3(0.90,0.92,0.94) : uKind == 8 ? vec3(0.62,0.52,0.34) : vec3(0.78,0.22,0.10);
        vec3 rb = uKind == 2 ? vec3(0.55,0.58,0.62) : vec3(0.92,0.92,0.90);
        col = mix(ra, rb, rum);
      }
      if (ax < roadH) {
        vec3 asp = vec3(0.18, 0.185, 0.20);
        if (uKind == 2) asp = vec3(0.50, 0.56, 0.62);
        else if (uKind == 3) asp = vec3(0.36, 0.24, 0.14);
        else if (uKind == 5) asp = vec3(0.22, 0.24, 0.26);
        else if (uKind == 6) asp = vec3(0.07, 0.08, 0.16);
        else if (uKind == 8) asp = vec3(0.22, 0.22, 0.24);
        else if (uKind == 1) asp = vec3(0.08, 0.05, 0.12);
        else if (uKind == 4) asp = vec3(0.10, 0.11, 0.13);
        asp += (hash(vec2(floor(xw * 64.0), floor(z * 14.0))) - 0.5) * 0.05;
        col = asp;
        if (abs(ax - roadH + 0.04) < 0.038) {
          col = mix(vec3(0.96, 0.86, 0.18), uAccent, 0.08);
        }
        float dash = fract(z * 0.48 - uScroll);
        if (ax < 0.055 && dash < 0.52) col = vec3(0.95, 0.95, 0.92);
        if (abs(ax - 0.74) < 0.022 && dash < 0.38 && uKind != 5 && uKind != 6) {
          col = vec3(0.78, 0.80, 0.82);
        }
        if (uKind == 4) {
          vec2 ru = vec2(uv.x, mix(0.40, 0.22, clamp(sy * 3.4, 0.0, 1.0)));
          vec3 refl = uHasSky > 0.5 ? texture(uSky, ru).rgb : uSky1;
          col = mix(col, refl, 0.42 * (1.0 - smoothstep(10.0, 26.0, z)));
        }
        col += sunC * 0.12 * exp(-abs(xw) * 0.35) * (1.0 - smoothstep(8.0, 22.0, z));
        col += uAccent * uLoad * 0.05;
      }
    }

    float fog = smoothstep(14.0, 28.0, z);
    if (uHasSky > 0.5) {
      vec3 skyC = texture(uSky, vec2(uv.x, clamp(0.72, 0.0, 1.0))).rgb;
      col = mix(col, skyC, fog * 0.38);
    } else {
      col = mix(col, horCol, fog);
    }
  }

  if (uKind == 4) {
    float rx = fract(uv.x * 90.0 + uv.y * 12.0 + uTime * 0.4);
    float ry = fract(uv.y * 16.0 - uTime * (4.2 + uSpeed * 0.2));
    if (rx < 0.028 && ry > 0.55) col += vec3(0.55, 0.65, 0.75) * 0.45;
  }
  if (uKind == 3 || uKind == 8) {
    float hz = n2(uv * vec2(22.0, 5.0) + vec2(uScroll * 0.4, uTime * 0.55));
    float band = smoothstep(0.16, 0.0, abs(horizon - uv.y));
    col += vec3(1.0, 0.90, 0.62) * hz * (0.045 + 0.05 * uLoad) * band;
  }
  if (uKind == 9) {
    float blink = step(0.5, fract(uTime * 2.2));
    col += vec3(1.0, 0.10, 0.08) * blink * exp(-length((uv - vec2(0.22, horizon - 0.01)) * vec2(aspect, 1.0)) * 28.0);
    col += vec3(1.0) * (1.0 - blink) * exp(-length((uv - vec2(0.78, horizon - 0.01)) * vec2(aspect, 1.0)) * 28.0);
  }

  col *= smoothstep(0.0, 0.05, uv.y);
  float vig = smoothstep(1.35, 0.22, length((uv - vec2(0.5, 0.48)) * vec2(1.15, 1.0)));
  col *= mix(0.62, 1.0, vig);
  col = pow(max(col, 0.0), vec3(0.92));
  float lip = smoothstep(0.0, 0.045, horizon - uv.y);
  frag = vec4(col, lip);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) throw new Error("shader");
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(log || "compile");
  }
  return s;
}

function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram();
  if (!p) throw new Error("program");
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || "link");
  }
  return p;
}

function loc(gl: WebGL2RenderingContext, p: WebGLProgram, name: string) {
  return gl.getUniformLocation(p, name);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const PARTICLE_LIMITS: Record<number, number> = {
  0: 180,
  1: 220,
  2: 640,
  3: 300,
  4: 220,
  5: 180,
  6: 180,
  7: 300,
  8: 0,
};

export class GlRoad {
  private gl: WebGL2RenderingContext;
  private fs: WebGLProgram;
  private pt: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private buf: WebGLBuffer;
  private wasm: WasmCore | null = null;
  private last = performance.now();
  private scroll = 0;
  fps = 0;
  private frames = 0;
  private fpsT = 0;
  private uFs: Record<string, WebGLUniformLocation | null>;
  private uPt: Record<string, WebGLUniformLocation | null>;
  private skies = new Map<string, WebGLTexture>();
  private skyReady = new Set<string>();
  private skyFailed = new Set<string>();
  private skyLoads = new Map<string, Promise<void>>();
  private dummy: WebGLTexture;
  private base = "/";

  constructor(canvas: HTMLCanvasElement, base = "/") {
    this.base = base.replace(/\/?$/, "/");
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("webgl2");
    this.gl = gl;
    this.fs = program(gl, VERT_FS, FRAG_FS);
    this.pt = program(gl, VERT_PT, FRAG_PT);
    this.uFs = {
      uRes: loc(gl, this.fs, "uRes"),
      uTime: loc(gl, this.fs, "uTime"),
      uSpeed: loc(gl, this.fs, "uSpeed"),
      uLoad: loc(gl, this.fs, "uLoad"),
      uAccent: loc(gl, this.fs, "uAccent"),
      uSky0: loc(gl, this.fs, "uSky0"),
      uSky1: loc(gl, this.fs, "uSky1"),
      uKind: loc(gl, this.fs, "uKind"),
      uSky: loc(gl, this.fs, "uSky"),
      uHasSky: loc(gl, this.fs, "uHasSky"),
      uScroll: loc(gl, this.fs, "uScroll"),
      uShake: loc(gl, this.fs, "uShake"),
      uBump: loc(gl, this.fs, "uBump"),
    };
    this.uPt = {
      uRes: loc(gl, this.pt, "uRes"),
      uAccent: loc(gl, this.pt, "uAccent"),
      uKind: loc(gl, this.pt, "uKind"),
      uLimit: loc(gl, this.pt, "uLimit"),
    };
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    if (!vao || !buf) throw new Error("vao");
    this.vao = vao;
    this.buf = buf;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, 2048 * 16, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    const dummy = gl.createTexture();
    if (!dummy) throw new Error("tex");
    gl.bindTexture(gl.TEXTURE_2D, dummy);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 20, 24, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.dummy = dummy;
  }

  setBase(base: string) {
    this.base = assetRoot(base);
  }

  ensureSky(kind: string) {
    void this.loadSky(kind);
  }

  private loadSky(kind: string): Promise<void> {
    if (this.skyReady.has(kind) || this.skyFailed.has(kind)) return Promise.resolve();
    const existing = this.skyLoads.get(kind);
    if (existing) return existing;

    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) {
      this.skyFailed.add(kind);
      return Promise.resolve();
    }
    this.skies.set(kind, tex);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 20, 24, 255]));

    const loading = loadImageAsset(`${this.base}skies/${kind}.jpg`)
      .then((img) => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.skyReady.add(kind);
      })
      .catch(() => {
        this.skyFailed.add(kind);
      });
    this.skyLoads.set(kind, loading);
    return loading;
  }

  async prepareSkies(kinds: string[]) {
    await Promise.all(kinds.map((kind) => this.loadSky(kind)));
  }

  async attachWasm(base: string): Promise<WasmCore | null> {
    this.setBase(base);
    this.wasm = await loadWasm(this.base);
    return this.wasm;
  }

  get hasWasmParticles() {
    return Boolean(this.wasm ?? getWasm());
  }

  resize(cssW: number, cssH: number, dpr: number) {
    const gl = this.gl;
    const w = Math.max(1, Math.floor(cssW * dpr));
    const h = Math.max(1, Math.floor(cssH * dpr));
    if (gl.canvas.width !== w) gl.canvas.width = w;
    if (gl.canvas.height !== h) gl.canvas.height = h;
    gl.viewport(0, 0, w, h);
  }

  frame(now: number, scene: Scene, speedMps: number, load: number, shake = 0, bump = 0) {
    const gl = this.gl;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.frames += 1;
    this.fpsT += dt;
    if (this.fpsT >= 0.4) {
      this.fps = this.frames / this.fpsT;
      this.frames = 0;
      this.fpsT = 0;
    }

    const kind = KIND_INDEX[scene.kind] ?? 0;
  const wasm = this.wasm ?? getWasm();
  if (wasm) wasm.vd_tick(dt, speedMps, kind, now / 1000);

    const accent = hexToRgb(scene.accent);
    const sky0 = hexToRgb(scene.sky[0]);
    const sky1 = hexToRgb(scene.sky[1]);
    const res: [number, number] = [gl.canvas.width, gl.canvas.height];

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.fs);
    gl.uniform2f(this.uFs.uRes, res[0], res[1]);
    gl.uniform1f(this.uFs.uTime, now / 1000);
    gl.uniform1f(this.uFs.uSpeed, speedMps);
    gl.uniform1f(this.uFs.uLoad, load);
    gl.uniform3f(this.uFs.uAccent, accent[0], accent[1], accent[2]);
    gl.uniform3f(this.uFs.uSky0, sky0[0], sky0[1], sky0[2]);
    gl.uniform3f(this.uFs.uSky1, sky1[0], sky1[1], sky1[2]);
    gl.uniform1i(this.uFs.uKind, kind);
    this.ensureSky(scene.kind);
    const skyTex = this.skies.get(scene.kind) ?? this.dummy;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, skyTex);
    gl.uniform1i(this.uFs.uSky, 0);
    gl.uniform1f(this.uFs.uHasSky, this.skyReady.has(scene.kind) ? 1 : 0);
    this.scroll += Math.max(0, speedMps) * dt * 0.11;
    gl.uniform1f(this.uFs.uScroll, this.scroll);
    gl.uniform1f(this.uFs.uShake, shake);
    gl.uniform1f(this.uFs.uBump, bump);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const particleLimit = PARTICLE_LIMITS[kind] ?? 160;
    if (wasm && particleLimit > 0) {
      const data = wasm.particles();
      const count = Math.min(data.length / 4, particleLimit);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.pt);
      gl.uniform2f(this.uPt.uRes, res[0], res[1]);
      gl.uniform3f(this.uPt.uAccent, accent[0], accent[1], accent[2]);
      gl.uniform1i(this.uPt.uKind, kind);
      gl.uniform1i(this.uPt.uLimit, count);
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, count * 4));
      gl.drawArrays(gl.POINTS, 0, count);
      gl.bindVertexArray(null);
    }
  }
}
