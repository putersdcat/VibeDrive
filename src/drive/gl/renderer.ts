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

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float n2(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / max(uRes.y, 1.0);
  uv.x += 0.0025 * uLoad * sin(uTime * 29.0);
  float horizon = 0.58;

  vec3 zenith = uSky0;
  vec3 horCol = uSky1;
  float skyT = clamp((uv.y - horizon) / max(1.0 - horizon, 0.001), 0.0, 1.0);
  vec3 col = mix(horCol, zenith, pow(skyT, 0.72));

  vec2 sun = vec2(0.18, 0.68);
  vec3 sunC = mix(uAccent, vec3(1.0, 0.86, 0.55), 0.45);
  if (uKind == 8) { sun = vec2(0.74, 0.71); sunC = vec3(1.00, 0.93, 0.52); }
  else if (uKind == 3) { sun = vec2(0.80, 0.64); sunC = vec3(1.00, 0.74, 0.28); }
  else if (uKind == 2) { sun = vec2(0.22, 0.70); sunC = vec3(0.96, 0.98, 1.00); }
  else if (uKind == 7) { sun = vec2(0.82, 0.66); sunC = vec3(1.00, 0.52, 0.70); }
  else if (uKind == 6) { sun = vec2(0.68, 0.74); sunC = uAccent; }
  else if (uKind == 5) { sun = vec2(0.5, 0.72); sunC = mix(uAccent, vec3(1.0), 0.4); }
  else if (uKind == 0 || uKind == 4) { sun = vec2(0.16, 0.66); sunC = vec3(1.00, 0.62, 0.28); }
  float sd = length((uv - sun) * vec2(aspect, 1.0));
  col += sunC * 0.65 * exp(-sd * 16.0);
  col += sunC * 0.28 * exp(-sd * 5.5);
  col += mix(uAccent, sunC, 0.5) * 0.55 * exp(-abs(uv.y - horizon) * 18.0);

  if (uKind == 0 || uKind == 1 || uKind == 6 || uKind == 7 || uKind == 9) {
    float sp = hash(floor(uv * vec2(110.0, 58.0)));
    if (sp > 0.987) col += vec3(0.85, 0.92, 1.0) * (0.45 + 0.55 * n2(uv * 30.0 + uTime * 0.05));
  }
  if (uKind == 6) {
    col += uAccent * 0.28 * n2(uv * 2.8 + vec2(uTime * 0.015, 0.2));
    col += vec3(0.28, 0.10, 0.62) * 0.22 * n2(uv * 1.4 + 8.0);
  }

  if (uv.y > horizon && uv.y < horizon + 0.18) {
    float mx = uv.x * 6.0;
    float ridge = 0.0;
    if (uKind == 2) ridge = 0.11 + 0.07 * sin(mx * 1.3) + 0.035 * sin(mx * 3.4 + 1.1);
    else if (uKind == 3) ridge = 0.055 + 0.04 * n2(vec2(uv.x * 5.0, 2.2));
    else if (uKind == 8) ridge = 0.02 * n2(vec2(uv.x * 9.0, 1.0));
    else if (uKind == 7) ridge = 0.06 + 0.03 * sin(mx * 2.0);
    else if (uKind != 5 && uKind != 6) ridge = 0.04 + 0.03 * n2(vec2(uv.x * 7.0, 1.4));
    if (uv.y < horizon + ridge) {
      vec3 mcol = uKind == 2 ? vec3(0.76, 0.84, 0.90)
                : uKind == 3 ? vec3(0.58, 0.30, 0.14)
                : uKind == 8 ? vec3(0.18, 0.42, 0.22)
                : uKind == 7 ? vec3(0.16, 0.05, 0.12)
                : vec3(0.035, 0.04, 0.055);
      col = mcol;
    }
  }

  if (uv.y < horizon) {
    float sy = max(horizon - uv.y, 0.0007);
    float z = 0.26 / sy;
    float scroll = uTime * (6.5 + uSpeed * 16.0);
    float xw = (uv.x - 0.5) * aspect * z * 1.18;
    float band = fract(z * 0.18 + scroll * 0.01);

    vec3 ground = mix(vec3(0.08, 0.10, 0.08), vec3(0.12, 0.15, 0.11), step(0.5, band));
    if (uKind == 2) ground = mix(vec3(0.88, 0.92, 0.95), vec3(0.72, 0.80, 0.86), band);
    else if (uKind == 3) ground = mix(vec3(0.78, 0.48, 0.18), vec3(0.92, 0.64, 0.28), step(0.5, band));
    else if (uKind == 8) ground = mix(vec3(0.28, 0.52, 0.20), vec3(0.42, 0.60, 0.18), step(0.5, band));
    else if (uKind == 5) ground = mix(vec3(0.74, 0.80, 0.78), vec3(0.58, 0.66, 0.64), band);
    else if (uKind == 6) ground = mix(vec3(0.05, 0.05, 0.12), vec3(0.10, 0.08, 0.22), band);
    else if (uKind == 7) ground = mix(vec3(0.16, 0.05, 0.10), vec3(0.26, 0.07, 0.14), band);
    else if (uKind == 1) ground = mix(vec3(0.06, 0.03, 0.10), vec3(0.10, 0.04, 0.14), band);

    if (uKind == 8 && xw < -2.55) {
      ground = mix(vec3(0.10, 0.40, 0.58), vec3(0.18, 0.62, 0.72), 0.5 + 0.5 * sin(xw * 1.8 + uTime));
    }

    col = mix(ground, horCol, clamp((z - 16.0) / 22.0, 0.0, 1.0));

    float roadH = 1.62;
    float ax = abs(xw);
    if (ax < roadH + 0.62) {
      if (ax > roadH) {
        vec3 sh = uKind == 2 ? vec3(0.93, 0.95, 0.97)
                : uKind == 3 ? vec3(0.52, 0.32, 0.14)
                : uKind == 8 ? vec3(0.55, 0.52, 0.42)
                : vec3(0.16, 0.16, 0.15);
        if (mod(floor(z * 5.0 + scroll * 0.18) + floor(xw * 7.0), 2.0) < 0.5 && uKind != 2)
          sh *= 0.78;
        col = mix(col, sh, 1.0 - clamp((z - 16.0) / 22.0, 0.0, 1.0));
      }
      if (ax < roadH) {
        vec3 asp = uKind == 2 ? vec3(0.52, 0.58, 0.64)
                 : uKind == 3 ? vec3(0.40, 0.26, 0.14)
                 : uKind == 5 ? vec3(0.14, 0.16, 0.18)
                 : uKind == 6 ? vec3(0.07, 0.08, 0.16)
                 : uKind == 8 ? vec3(0.20, 0.20, 0.22)
                 : vec3(0.09, 0.095, 0.11);
        asp += (hash(vec2(floor(xw * 48.0), floor(z * 10.0))) - 0.5) * 0.045;
        if (uKind == 4) asp = mix(asp, horCol * 0.4 + uAccent * 0.08, 0.42);
        if (uKind == 1) asp = mix(asp, uAccent * 0.12, 0.18);
        col = asp;
        if (abs(ax - roadH + 0.035) < 0.048) col = mix(vec3(0.96, 0.94, 0.86), uAccent, 0.12);
        float dash = fract(z * 0.52 - scroll * 0.09);
        if (ax < 0.065 && dash < 0.55) {
          col = (uKind == 8) ? vec3(0.96, 0.84, 0.16) : vec3(0.93, 0.94, 0.92);
        }
        if (abs(ax - 0.78) < 0.03 && dash < 0.42 && uKind != 6 && uKind != 5) {
          col = vec3(0.82, 0.83, 0.85);
        }
        col += uAccent * uLoad * 0.06 * clamp(1.0 - z * 0.04, 0.0, 1.0);
      }
    }

    for (int i = 0; i < 20; i++) {
      float id = float(i);
      float zs = fract(hash(vec2(id, 1.7)) + scroll * 0.012);
      float zw = 1.35 + zs * 30.0;
      float side = hash(vec2(id, 3.1)) > 0.5 ? 1.0 : -1.0;
      float xoff = side * (roadH + 0.5 + hash(vec2(id, 8.8)) * 1.6);
      float sx = 0.5 + (xoff / zw) / (aspect * 1.18);
      float py = horizon - 0.26 / zw;
      vec2 q = uv - vec2(sx, py);
      float sc = 0.62 / zw;
      if (sc < 0.004) continue;
      if (uKind == 8) {
        float stem = smoothstep(sc * 0.14, 0.0, abs(q.x)) * step(0.0, q.y) * step(q.y, sc * 2.15);
        col = mix(col, vec3(0.32, 0.18, 0.08), stem);
        float fr = length(q - vec2(0.0, sc * 1.85));
        float canopy = (1.0 - smoothstep(sc * 0.5, sc * 0.95, fr)) * step(q.y, sc * 2.4);
        col = mix(col, vec3(0.10, 0.36, 0.12), canopy);
      } else if (uKind == 2) {
        float pine = smoothstep(sc * 0.55, 0.0, abs(q.x) + max(q.y, 0.0) * 0.35)
                   * step(0.0, q.y) * step(q.y, sc * 2.5);
        col = mix(col, vec3(0.16, 0.30, 0.26), pine);
      } else if (uKind == 3) {
        float cact = smoothstep(sc * 0.12, 0.0, abs(q.x)) * step(0.0, q.y) * step(q.y, sc * 1.6);
        col = mix(col, vec3(0.22, 0.42, 0.18), cact);
      } else if (uKind == 7) {
        float pag = smoothstep(sc * 0.42, 0.0, abs(q.x)) * step(0.0, q.y) * step(q.y, sc * 1.7);
        col = mix(col, vec3(0.20, 0.06, 0.10), pag);
        col += vec3(1.0, 0.42, 0.58) * exp(-length(q - vec2(0.0, sc * 1.35)) * 26.0 * zw) * 0.55;
      } else if (uKind == 0 || uKind == 1 || uKind == 4 || uKind == 9 || uKind == 5) {
        float pole = smoothstep(sc * 0.055, 0.0, abs(q.x)) * step(0.0, q.y) * step(q.y, sc * 2.05);
        col = mix(col, vec3(0.10, 0.10, 0.11), pole);
        vec3 lamp = uKind == 1 ? uAccent : (uKind == 5 ? vec3(0.85, 0.95, 1.0) : vec3(1.0, 0.82, 0.48));
        col += lamp * exp(-length(q - vec2(0.0, sc * 2.1)) * (36.0 * zw)) * 0.9;
      }
    }
  }

  if (uKind == 4) {
    float rx = fract(uv.x * 78.0 + uv.y * 10.0);
    float ry = fract(uv.y * 14.0 - uTime * (3.1 + uSpeed * 0.18));
    if (rx < 0.035 && ry > 0.62) col += vec3(0.50, 0.60, 0.70) * 0.38;
  }
  if (uKind == 9) {
    float blink = step(0.5, fract(uTime * 2.0));
    col += vec3(1.0, 0.12, 0.10) * blink * exp(-length((uv - vec2(0.22, horizon - 0.015)) * vec2(aspect, 1.0)) * 26.0);
    col += vec3(1.0) * (1.0 - blink) * exp(-length((uv - vec2(0.78, horizon - 0.015)) * vec2(aspect, 1.0)) * 26.0);
  }

  float vig = smoothstep(1.28, 0.18, length((uv - vec2(0.5, 0.46)) * vec2(1.12, 1.0)));
  col *= mix(0.42, 1.0, vig);
  col = pow(max(col, 0.0), vec3(0.90));
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
    gl.uniform2f(this.uFs.uRes, res[0], res[1]);
    gl.uniform1f(this.uFs.uTime, now / 1000);
    gl.uniform1f(this.uFs.uSpeed, speedMps);
    gl.uniform1f(this.uFs.uLoad, load);
    gl.uniform3f(this.uFs.uAccent, accent[0], accent[1], accent[2]);
    gl.uniform3f(this.uFs.uSky0, sky0[0], sky0[1], sky0[2]);
    gl.uniform3f(this.uFs.uSky1, sky1[0], sky1[1], sky1[2]);
    gl.uniform1i(this.uFs.uKind, kind);
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
