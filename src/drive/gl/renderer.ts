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
out vec4 frag;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);
  vec3 col = mix(uSky0, uSky1, uv.y);
  float horizon = 0.58;
  col += uAccent * 0.28 * exp(-abs(uv.y - horizon) * 16.0);

  if (uKind == 6) {
    for (int i = 0; i < 40; i++) {
      vec2 sp = vec2(hash(vec2(float(i), 2.1)), hash(vec2(float(i), 8.7)));
      sp.x = fract(sp.x + uTime * 0.01);
      float d = length((uv - sp) * vec2(aspect, 1.0));
      col += vec3(0.85, 0.93, 1.0) * smoothstep(0.006, 0.0, d);
    }
    col += uAccent * 0.12 * exp(-length(uv - vec2(0.72, 0.72)) * 8.0);
  }

  if (uKind == 2) {
    vec2 m = uv;
    float peaks = 0.62 + 0.08 * sin(m.x * 18.0) + 0.05 * sin(m.x * 7.0);
    if (uv.y < peaks && uv.y > horizon - 0.04) {
      col = mix(vec3(0.62, 0.72, 0.80), vec3(0.90, 0.94, 0.97), (peaks - uv.y) * 6.0);
    }
  }

  if (uKind == 3 && uv.y > horizon) {
    col = mix(col, vec3(0.78, 0.48, 0.18), 0.35);
  }

  if (uv.y < horizon) {
    float z = (horizon - uv.y) / horizon;
    z = clamp(z, 0.0, 1.0);
    float persp = z * z;
    float roadW = mix(0.04, 1.35, persp);
    float dx = abs(p.x);
    if (dx < roadW) {
      vec3 asphalt = uKind == 2 ? vec3(0.72, 0.78, 0.84)
                   : uKind == 3 ? vec3(0.38, 0.26, 0.14)
                   : uKind == 6 ? vec3(0.07, 0.08, 0.16)
                   : uKind == 8 ? vec3(0.22, 0.22, 0.24)
                   : uKind == 9 ? vec3(0.08, 0.09, 0.12)
                   : vec3(0.09, 0.10, 0.13);
      col = mix(asphalt, asphalt * 1.25, persp);
      float dashPhase = fract((0.18 / max(z, 0.02)) - uTime * (0.35 + uSpeed * 0.12));
      if (dx < mix(0.003, 0.018, persp) && dashPhase < 0.5) {
        col = uKind == 5 ? mix(uAccent, vec3(1.0), 0.35) : vec3(0.93, 0.94, 0.96);
      }
      float edge = abs(dx - roadW);
      if (edge < mix(0.004, 0.022, persp)) {
        col = mix(uAccent, col, 0.25);
      }
      col += uAccent * uLoad * 0.08 * persp;
    } else if (uKind == 1 || uKind == 0 || uKind == 5) {
      float side = (dx - roadW);
      float bldg = hash(vec2(floor((p.x) * 8.0), floor((1.0/max(z,0.04))*3.0)));
      if (side < 0.55 * persp && bldg > 0.55 && uv.y < horizon - 0.02) {
        col = mix(col, uKind == 1 ? vec3(0.12, 0.04, 0.18) : vec3(0.05, 0.05, 0.07), 0.85);
        if (uKind == 1 && hash(vec2(bldg, 4.2)) > 0.7) col += uAccent * 0.35;
      }
    }
  }

  if (uKind == 4) {
    float rain = hash(vec2(uv.x * 40.0, fract(uv.y * 8.0 - uTime * (2.4 + uSpeed * 0.2))));
    if (rain > 0.96) col += vec3(0.55, 0.65, 0.75);
  }

  if (uKind == 8) {
    vec2 sunp = vec2(0.78, 0.74);
    col += vec3(1.0, 0.9, 0.35) * 0.7 * exp(-length((uv - sunp) * vec2(aspect, 1.0)) * 12.0);
    if (uv.y > horizon) {
      col = mix(col, vec3(0.35, 0.72, 0.38), 0.18);
    }
    float palm = 0.0;
    for (int i = 0; i < 7; i++) {
      float px = 0.08 + float(i) * 0.14;
      float stem = smoothstep(0.012, 0.0, abs(uv.x - px)) * step(horizon, uv.y) * step(uv.y, horizon + 0.18);
      palm += stem;
    }
    col = mix(col, vec3(0.08, 0.18, 0.1), clamp(palm, 0.0, 1.0) * 0.85);
  }

  if (uKind == 9) {
    float rail = step(abs(uv.y - 0.36), 0.008);
    col = mix(col, vec3(0.7, 0.72, 0.78), rail);
    float blink = step(0.5, fract(uTime * 2.0));
    col += vec3(1.0, 0.15, 0.12) * blink * exp(-length(uv - vec2(0.22, 0.40)) * 40.0);
    col += vec3(1.0, 0.95, 0.95) * (1.0 - blink) * exp(-length(uv - vec2(0.78, 0.40)) * 40.0);
  }

  float vig = smoothstep(1.15, 0.25, length((uv - vec2(0.5, 0.48)) * vec2(1.1, 1.0)));
  col *= mix(0.55, 1.0, vig);
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
  float ps = mix(1.2, 7.5, persp) * a.z * (uRes.y / 720.0);
  if (uKind == 8) ps *= 2.4;
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
    if (abs(pc.x) > 0.25) discard;
    frag = vec4(0.78, 0.86, 0.92, 0.55);
    return;
  }
  if (d > 1.0) discard;
  vec3 c = uAccent;
  if (uKind == 2) c = vec3(0.95);
  if (uKind == 6) c = vec3(0.85, 0.93, 1.0);
  if (uKind == 7) c = mix(uAccent, vec3(1.0, 0.82, 0.90), 0.4);
  if (uKind == 8) {
    float k = mod(vKind, 3.0);
    if (k < 1.0) c = vec3(0.98, 0.84, 0.16);
    else if (k < 2.0) c = vec3(0.32, 0.72, 0.28);
    else c = vec3(0.86, 0.28, 0.16);
  }
  if (uKind == 9) c = vec3(0.45, 0.92, 1.0);
  frag = vec4(c, mix(0.15, 0.85, vNear) * (1.0 - d));
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

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("webgl2");
    this.gl = gl;
    this.fs = program(gl, VERT_FS, FRAG_FS);
    this.pt = program(gl, VERT_PT, FRAG_PT);
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
  }

  async attachWasm(base: string) {
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
    gl.uniform2f(gl.getUniformLocation(this.fs, "uRes"), res[0], res[1]);
    gl.uniform1f(gl.getUniformLocation(this.fs, "uTime"), now / 1000);
    gl.uniform1f(gl.getUniformLocation(this.fs, "uSpeed"), speedMps);
    gl.uniform1f(gl.getUniformLocation(this.fs, "uLoad"), load);
    gl.uniform3f(gl.getUniformLocation(this.fs, "uAccent"), accent[0], accent[1], accent[2]);
    gl.uniform3f(gl.getUniformLocation(this.fs, "uSky0"), sky0[0], sky0[1], sky0[2]);
    gl.uniform3f(gl.getUniformLocation(this.fs, "uSky1"), sky1[0], sky1[1], sky1[2]);
    gl.uniform1i(gl.getUniformLocation(this.fs, "uKind"), kind);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (wasm) {
      const data = wasm.particles();
      gl.enable(gl.BLEND);
      gl.useProgram(this.pt);
      gl.uniform2f(gl.getUniformLocation(this.pt, "uRes"), res[0], res[1]);
      gl.uniform3f(gl.getUniformLocation(this.pt, "uAccent"), accent[0], accent[1], accent[2]);
      gl.uniform1i(gl.getUniformLocation(this.pt, "uKind"), kind);
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
      gl.drawArrays(gl.POINTS, 0, data.length / 4);
      gl.bindVertexArray(null);
    }
  }
}
