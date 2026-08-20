import type { Scene } from "../types";
import { KIND_INDEX, getWasm, loadWasm, type WasmCore } from "../wasm";

const VERT_FS = `#version 300 es
precision highp float;
const vec2 POS[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main(){ gl_Position = vec4(POS[gl_VertexID], 0.0, 1.0); }
`;

const FRAG_FS = `#version 300 es
precision highp float;
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
  uv.x += 0.0018 * uLoad * sin(uTime * 31.0);
  float horizon = 0.56;
  float skyT = clamp((uv.y - horizon) / max(1.0 - horizon, 0.001), 0.0, 1.0);

  vec3 col = mix(uSky1, uSky0, pow(skyT, 0.72));
  vec3 horCol = uSky1;
  if (uHasSky > 0.5) {
    vec2 suv = vec2(clamp(uv.x, 0.001, 0.999), mix(0.64, 1.0, pow(skyT, 0.68)));
    col = texture(uSky, suv).rgb;
    horCol = texture(uSky, vec2(0.5, 0.64)).rgb;
  }

  vec2 sun = vec2(0.18, 0.70);
  vec3 sunC = mix(uAccent, vec3(1.0, 0.86, 0.55), 0.4);
  if (uKind == 8) { sun = vec2(0.78, 0.72); sunC = vec3(1.00, 0.90, 0.45); }
  else if (uKind == 3) { sun = vec2(0.82, 0.64); sunC = vec3(1.00, 0.72, 0.22); }
  else if (uKind == 2) { sun = vec2(0.22, 0.72); sunC = vec3(0.95, 0.97, 1.00); }
  else if (uKind == 5) { sun = vec2(0.50, 0.73); sunC = vec3(1.00, 0.94, 0.78); }
  else if (uKind == 7) { sun = vec2(0.80, 0.66); sunC = vec3(1.00, 0.50, 0.68); }
  else if (uKind == 6) { sun = vec2(0.68, 0.74); sunC = uAccent; }
  else if (uKind == 0 || uKind == 4 || uKind == 9) { sun = vec2(0.16, 0.67); sunC = vec3(1.00, 0.62, 0.28); }
  float sd = length((uv - sun) * vec2(aspect, 1.0));
  col += sunC * 0.55 * exp(-sd * 22.0);
  col += sunC * 0.22 * exp(-sd * 6.0);
  if (uKind == 8 || uKind == 3 || uKind == 5) {
    col += sunC * 0.12 * exp(-abs(uv.y - sun.y) * 40.0) * exp(-abs(uv.x - sun.x) * 1.6);
  }
  col += mix(uAccent, sunC, 0.5) * 0.28 * exp(-abs(uv.y - horizon) * 22.0);

  if (uKind == 0 || uKind == 1 || uKind == 6 || uKind == 9) {
    float sp = hash(floor(uv * vec2(140.0, 70.0)));
    if (sp > 0.989) col += vec3(0.85, 0.92, 1.0) * (0.4 + 0.6 * n2(uv * 40.0 + uTime * 0.04));
  }

  if (uHasSky < 0.5) horCol = col;

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
        vec3 asp = vec3(0.10, 0.105, 0.12);
        if (uKind == 2) asp = vec3(0.50, 0.56, 0.62);
        else if (uKind == 3) asp = vec3(0.36, 0.24, 0.14);
        else if (uKind == 5) asp = vec3(0.16, 0.18, 0.20);
        else if (uKind == 6) asp = vec3(0.07, 0.08, 0.16);
        else if (uKind == 8) asp = vec3(0.18, 0.18, 0.20);
        else if (uKind == 1) asp = vec3(0.08, 0.05, 0.12);
        else if (uKind == 4) asp = vec3(0.07, 0.08, 0.10);
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
        if (uKind == 4 || uKind == 8) {
          vec2 ru = vec2(uv.x, mix(0.40, 0.22, clamp(sy * 3.4, 0.0, 1.0)));
          vec3 refl = uHasSky > 0.5 ? texture(uSky, ru).rgb : uSky1;
          float wet = uKind == 4 ? 0.42 : 0.18;
          col = mix(col, refl, wet * (1.0 - smoothstep(10.0, 26.0, z)));
        }
        col += sunC * 0.12 * exp(-abs(xw) * 0.35) * (1.0 - smoothstep(8.0, 22.0, z));
        col += uAccent * uLoad * 0.05;
      }
    }

    float fog = smoothstep(11.0, 30.0, z);
    col = mix(col, horCol, fog);

    for (int i = 0; i < 28; i++) {
      float id = float(i);
      float zs = fract(hash(vec2(id, 1.7)) + uScroll * 0.045);
      float zw = 1.2 + zs * 34.0;
      float side = hash(vec2(id, 3.1)) > 0.5 ? 1.0 : -1.0;
      float xoff = side * (roadH + 0.55 + hash(vec2(id, 8.8)) * 2.2);
      float sx = 0.5 + (xoff / zw) / (aspect * 1.08);
      float py = horizon - 0.34 / zw;
      vec2 q = uv - vec2(sx, py);
      float sc = 0.78 / zw;
      if (sc < 0.0035) continue;
      if (uKind == 8) {
        float stem = smoothstep(sc * 0.10, 0.0, abs(q.x)) * step(0.0, q.y) * step(q.y, sc * 2.4);
        col = mix(col, vec3(0.28, 0.16, 0.07), stem);
        float fr = length((q - vec2(0.0, sc * 2.05)) * vec2(1.0, 1.35));
        float canopy = (1.0 - smoothstep(sc * 0.55, sc * 1.15, fr)) * step(q.y, sc * 2.7);
        col = mix(col, vec3(0.08, 0.34, 0.10), canopy);
      } else if (uKind == 2) {
        float pine = smoothstep(sc * 0.62, 0.0, abs(q.x) + max(q.y, 0.0) * 0.32)
                   * step(0.0, q.y) * step(q.y, sc * 2.8);
        col = mix(col, vec3(0.14, 0.28, 0.24), pine);
      } else if (uKind == 3) {
        float cact = smoothstep(sc * 0.11, 0.0, abs(q.x)) * step(0.0, q.y) * step(q.y, sc * 1.8);
        col = mix(col, vec3(0.20, 0.40, 0.16), cact);
      } else if (uKind == 7) {
        float pag = smoothstep(sc * 0.40, 0.0, abs(q.x)) * step(0.0, q.y) * step(q.y, sc * 1.9);
        col = mix(col, vec3(0.18, 0.05, 0.09), pag);
        col += vec3(1.0, 0.42, 0.58) * exp(-length(q - vec2(0.0, sc * 1.45)) * 22.0 * zw) * 0.7;
      } else if (uKind == 1) {
        float bld = smoothstep(sc * 0.55, 0.0, abs(q.x)) * step(0.0, q.y) * step(q.y, sc * (1.6 + hash(vec2(id,9.0))));
        col = mix(col, vec3(0.08, 0.03, 0.16), bld);
        col += uAccent * exp(-length(q - vec2(0.0, sc * 1.1)) * 18.0 * zw) * 0.55;
      } else {
        float pole = smoothstep(sc * 0.045, 0.0, abs(q.x)) * step(0.0, q.y) * step(q.y, sc * 2.2);
        col = mix(col, vec3(0.09, 0.09, 0.10), pole);
        vec3 lamp = uKind == 5 ? vec3(0.85, 0.95, 1.0) : vec3(1.0, 0.80, 0.42);
        col += lamp * exp(-length(q - vec2(0.0, sc * 2.25)) * (32.0 * zw)) * 0.95;
      }
    }
  }

  if (uKind == 4) {
    float rx = fract(uv.x * 90.0 + uv.y * 12.0 + uTime * 0.4);
    float ry = fract(uv.y * 16.0 - uTime * (4.2 + uSpeed * 0.2));
    if (rx < 0.028 && ry > 0.55) col += vec3(0.55, 0.65, 0.75) * 0.45;
  }
  if (uKind == 3 || uKind == 8) {
    float hz = n2(uv * vec2(18.0, 4.0) + vec2(0.0, uTime * 0.7));
    uv.x += 0.0;
    col += vec3(1.0, 0.85, 0.4) * hz * 0.03 * uLoad;
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
  frag = vec4(col, 1.0);
}
`;

const VERT_PT = `#version 300 es
precision highp float;
layout(location=0) in vec4 a;
uniform vec2 uRes;
uniform int uKind;
out float vKind;
out float vNear;
void main(){
  float z = clamp(a.y, 0.0, 1.2);
  float persp = z * z;
  float aspect = uRes.x / max(uRes.y, 1.0);
  float x = a.x * mix(0.08, 1.6, persp) / aspect;
  float y = mix(0.16, -1.0, persp);
  gl_Position = vec4(x, y, 0.0, 1.0);
  float ps = mix(1.4, 8.5, persp) * a.z * (uRes.y / 720.0);
  if (uKind == 8) ps *= 2.6;
  if (uKind == 2) ps *= 1.4;
  gl_PointSize = ps;
  vKind = a.w;
  vNear = persp;
}
`;

const FRAG_PT = `#version 300 es
precision highp float;
uniform vec3 uAccent;
uniform int uKind;
in float vKind;
in float vNear;
out vec4 frag;
void main(){
  vec2 pc = gl_PointCoord * 2.0 - 1.0;
  float d = dot(pc, pc);
  if (uKind == 4) {
    if (abs(pc.x) > 0.22) discard;
    frag = vec4(0.78, 0.86, 0.92, 0.5);
    return;
  }
  if (d > 1.0) discard;
  vec3 c = uAccent;
  if (uKind == 2) c = vec3(0.96, 0.98, 1.0);
  if (uKind == 6) c = vec3(0.85, 0.93, 1.0);
  if (uKind == 7) c = mix(uAccent, vec3(1.0, 0.82, 0.90), 0.45);
  if (uKind == 8) {
    float k = mod(vKind, 3.0);
    if (k < 1.0) c = vec3(0.98, 0.84, 0.16);
    else if (k < 2.0) c = vec3(0.32, 0.72, 0.28);
    else c = vec3(0.86, 0.28, 0.16);
  }
  if (uKind == 9) c = vec3(0.45, 0.92, 1.0);
  frag = vec4(c, mix(0.12, 0.88, vNear) * (1.0 - d));
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

export class GlRoad {
  private gl: WebGL2RenderingContext;
  private fs: WebGLProgram;
  private pt: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private buf: WebGLBuffer;
  private wasm: WasmCore | null = null;
  private last = performance.now();
  fps = 0;
  private frames = 0;
  private fpsT = 0;
  private uFs: Record<string, WebGLUniformLocation | null>;
  private uPt: Record<string, WebGLUniformLocation | null>;
  private skies = new Map<string, WebGLTexture>();
  private skyReady = new Set<string>();
  private dummy: WebGLTexture;
  private base = "/";

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
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
    };
    this.uPt = {
      uRes: loc(gl, this.pt, "uRes"),
      uAccent: loc(gl, this.pt, "uAccent"),
      uKind: loc(gl, this.pt, "uKind"),
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
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    const dummy = gl.createTexture();
    if (!dummy) throw new Error("tex");
    gl.bindTexture(gl.TEXTURE_2D, dummy);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 20, 24, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.dummy = dummy;
  }

  setBase(base: string) {
    this.base = base.replace(/\/?$/, "/");
  }

  ensureSky(kind: string) {
    if (this.skyReady.has(kind) || this.skies.has(kind)) return;
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) return;
    this.skies.set(kind, tex);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 20, 24, 255]));
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.skyReady.add(kind);
    };
    img.src = `${this.base}skies/${kind}.jpg`;
  }

  async attachWasm(base: string) {
    this.setBase(base);
    this.wasm = await loadWasm(base);
  }

  resize(cssW: number, cssH: number, dpr: number) {
    const gl = this.gl;
    const w = Math.max(1, Math.floor(cssW * dpr));
    const h = Math.max(1, Math.floor(cssH * dpr));
    if (gl.canvas.width === w && gl.canvas.height === h) return;
    gl.canvas.width = w;
    gl.canvas.height = h;
    gl.viewport(0, 0, w, h);
  }

  frame(now: number, scene: Scene, speedMps: number, load: number) {
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

    gl.disable(gl.BLEND);
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
    gl.uniform1f(this.uFs.uScroll, (now / 1000) * (0.55 + speedMps * 0.085));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (wasm) {
      const data = wasm.particles();
      gl.enable(gl.BLEND);
      gl.useProgram(this.pt);
      gl.uniform2f(this.uPt.uRes, res[0], res[1]);
      gl.uniform3f(this.uPt.uAccent, accent[0], accent[1], accent[2]);
      gl.uniform1i(this.uPt.uKind, kind);
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
      gl.drawArrays(gl.POINTS, 0, data.length / 4);
      gl.bindVertexArray(null);
    }
  }
}
