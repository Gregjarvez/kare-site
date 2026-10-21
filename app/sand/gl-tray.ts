import { QUAD_VS, SCENE_FS, SIM_FS } from "./gl-shaders";
import type { Look } from "./looks";
import { PassClock } from "./pass-clock";
import { drawStroke, drawWords } from "./text-stamp";
import { loadHandFont, tidy, type Tray, type TrayOptions } from "./tray";

const SIM = 384;
const RIN = 1;
const ROUT = 1.16;
const HR = 0.055;
const HB = 0.15;
const ROD_SPEED = (Math.PI * 2) / 9;

type Target = { fb: WebGLFramebuffer; tex: WebGLTexture };

export class GlTray implements Tray {
  readonly kind = "gl";
  private gl: WebGL2RenderingContext;
  private sim: WebGLProgram;
  private scene: WebGLProgram;
  private targets: [Target, Target];
  private textTex: WebGLTexture;
  private strokeTex: WebGLTexture;
  private textCanvas = document.createElement("canvas");
  private strokeCanvas = document.createElement("canvas");
  private encoded: boolean;
  private uniforms = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
  private clock: PassClock;
  private raf = 0;
  private last = 0;
  private time = 0;
  private running = false;
  private rod = 0.6;
  private yaw = 0;
  private yawTarget = 0;
  private elev = 0.92;
  private elevTarget = 0.92;
  private night = 0;
  private nightTarget = 0;
  private reveal = 2;
  private textActive = false;
  private strokeDirty = false;
  private lastStroke: [number, number] | null = null;
  private look: Look;
  private width = 1;
  private height = 1;
  private scale = 1;
  private center: [number, number] = [0, 0];

  constructor(private canvas: HTMLCanvasElement, options: TrayOptions) {
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    this.look = options.look;
    this.night = this.nightTarget = options.night ? 1 : 0;
    this.clock = new PassClock(options.onPhase);

    const float = gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float");
    this.encoded = !float;

    this.sim = this.program(QUAD_VS, SIM_FS);
    this.scene = this.program(QUAD_VS, SCENE_FS);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    for (const p of [this.sim, this.scene]) {
      const loc = gl.getAttribLocation(p, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    this.targets = [this.target(), this.target()];
    this.clearState();

    for (const c of [this.textCanvas, this.strokeCanvas]) {
      c.width = SIM;
      c.height = SIM;
    }
    this.textTex = this.canvasTexture();
    this.strokeTex = this.canvasTexture();
  }

  setLook(look: Look) {
    this.look = look;
    if (!this.running) this.frame(this.last);
  }

  setNight(night: boolean) {
    this.nightTarget = night ? 1 : 0;
  }

  setTilt(x: number, y: number) {
    this.yawTarget = x * 0.09;
    this.elevTarget = 0.92 - y * 0.06;
  }

  async inscribe(text: string, passSeconds = 24) {
    const words = tidy(text);
    if (!words) return;
    await loadHandFont();
    drawWords(this.textCanvas, words, { cx: SIM / 2, cy: SIM / 2, width: SIM * 0.72, height: SIM * 0.62 });
    this.clearState();
    this.upload(this.textTex, this.textCanvas);
    this.clock.begin(words.length, passSeconds);
  }

  pointerDown(clientX: number, clientY: number) {
    const uv = this.toSand(clientX, clientY);
    if (!uv) return false;
    this.lastStroke = uv;
    this.strokeTo(uv);
    return true;
  }

  pointerMove(clientX: number, clientY: number) {
    if (!this.lastStroke) return;
    const uv = this.toSand(clientX, clientY);
    if (!uv) {
      this.lastStroke = null;
      return;
    }
    this.strokeTo(uv);
  }

  pointerUp() {
    this.lastStroke = null;
  }

  hitsSand(clientX: number, clientY: number) {
    return this.toSand(clientX, clientY) !== null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.frame(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    this.clock.detach();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, Math.round(rect.width * dpr));
    this.height = Math.max(1, Math.round(rect.height * dpr));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const sE = Math.sin(this.elev);
    const cE = Math.cos(this.elev);
    const top = -ROUT * sE - HR * cE;
    const bottom = ROUT * sE + HB * cE;
    this.scale = Math.min(this.width / (2 * ROUT * 1.12), this.height / ((bottom - top) * 1.16));
    this.center = [this.width / 2, this.height / 2 - ((top + bottom) / 2) * this.scale];
    if (!this.running) this.frame(this.last);
  }

  private frame(now: number) {
    const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.time += dt;
    const ease = 1 - Math.exp(-dt * 3);
    this.yaw += (this.yawTarget - this.yaw) * ease;
    this.elev += (this.elevTarget - this.elev) * ease;
    this.night += (this.nightTarget - this.night) * (1 - Math.exp(-dt * 1.6));

    const a0 = this.rod;
    const sweep = ROD_SPEED * dt;
    this.rod = (this.rod + sweep) % (Math.PI * 2);
    const pass = this.clock.tick(dt);
    this.reveal = pass.reveal;
    this.textActive = pass.stampText;

    this.step(a0, sweep, pass.front, pass.decay);
    this.draw();
  }

  private step(a0: number, sweep: number, front: number, decay: number) {
    const gl = this.gl;
    const [src, dst] = this.targets;
    const strokeOn = this.strokeDirty;
    if (strokeOn) this.upload(this.strokeTex, this.strokeCanvas);

    gl.useProgram(this.sim);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.viewport(0, 0, SIM, SIM);
    gl.disable(gl.BLEND);
    this.bindTex(0, src.tex);
    this.bindTex(1, this.textTex);
    this.bindTex(2, this.strokeTex);
    this.set1i(this.sim, "uState", 0);
    this.set1i(this.sim, "uText", 1);
    this.set1i(this.sim, "uStroke", 2);
    this.set2f(this.sim, "uTexel", 1 / SIM, 1 / SIM);
    this.set1f(this.sim, "uReveal", this.reveal);
    this.set1f(this.sim, "uStampText", this.textActive ? 1 : 0);
    this.set1f(this.sim, "uStampStroke", strokeOn ? 1 : 0);
    this.set1f(this.sim, "uA0", a0);
    this.set1f(this.sim, "uSweep", sweep);
    this.set1f(this.sim, "uFront", front);
    this.set1f(this.sim, "uDecay", decay);
    this.set1f(this.sim, "uRelax", 0.006);
    this.set1f(this.sim, "uEncoded", this.encoded ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.targets = [dst, src];

    if (strokeOn) {
      this.strokeDirty = false;
      this.strokeCanvas.getContext("2d")!.clearRect(0, 0, SIM, SIM);
    }
  }

  private draw() {
    const gl = this.gl;
    const { sand, tray, rod } = this.look;
    const p = this.scene;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.bindTex(0, this.targets[0].tex);
    this.set1i(p, "uState", 0);
    this.set2f(p, "uRes", this.width, this.height);
    this.set2f(p, "uCenter", this.center[0], this.center[1]);
    this.set1f(p, "uScale", this.scale);
    this.set1f(p, "uElev", this.elev);
    this.set1f(p, "uYaw", this.yaw);
    this.set1f(p, "uRod", this.rod);
    this.set1f(p, "uNight", this.night);
    this.set1f(p, "uTime", this.time);
    this.set1f(p, "uEncoded", this.encoded ? 1 : 0);
    this.set2f(p, "uTexel", 2 / SIM, 2 / SIM);
    this.set3f(p, "uSand", sand.colour);
    this.set3f(p, "uSandTint", sand.tinted);
    this.set3f(p, "uSandDark", sand.dark);
    this.set3f(p, "uSandClear", sand.clear);
    this.set1f(p, "uSparkle", sand.sparkle);
    this.set1f(p, "uGrain", sand.grain);
    this.set3f(p, "uTop", tray.top);
    this.set3f(p, "uTopBands", tray.topBands);
    this.set3f(p, "uWall", tray.wall);
    this.set3f(p, "uWallBands", tray.wallBands);
    this.set1f(p, "uPores", tray.pores);
    this.set3f(p, "uRodTint", rod.tint);
    this.set1f(p, "uRodGloss", rod.gloss);
    this.set1f(p, "uRodShine", rod.shine);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private toSand(clientX: number, clientY: number): [number, number] | null {
    const rect = this.canvas.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * this.width;
    const sy = ((clientY - rect.top) / rect.height) * this.height;
    const x = (sx - this.center[0]) / this.scale;
    const z = (sy - this.center[1]) / this.scale / Math.sin(this.elev);
    if (Math.hypot(x, z) > RIN * 0.97) return null;
    const c = Math.cos(-this.yaw);
    const s = Math.sin(-this.yaw);
    const px = c * x - s * z;
    const pz = s * x + c * z;
    return [(px * 0.5 + 0.5) * SIM, (pz * 0.5 + 0.5) * SIM];
  }

  private strokeTo(uv: [number, number]) {
    drawStroke(this.strokeCanvas, this.lastStroke ?? uv, uv, SIM * 0.022);
    this.lastStroke = uv;
    this.strokeDirty = true;
  }

  private clearState() {
    const gl = this.gl;
    for (const t of this.targets) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
      if (this.encoded) gl.clearColor(1.5 / 2.7, 0, 0, 1);
      else gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private target(): Target {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (this.encoded) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, SIM, SIM, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SIM, SIM, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE && !this.encoded) {
      this.encoded = true;
      return this.target();
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex };
  }

  private canvasTexture() {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SIM, SIM, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  private upload(tex: WebGLTexture, canvas: HTMLCanvasElement) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }

  private bindTex(unit: number, tex: WebGLTexture) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  }

  private program(vs: string, fs: string) {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
    return p;
  }

  private loc(p: WebGLProgram, name: string) {
    let map = this.uniforms.get(p);
    if (!map) this.uniforms.set(p, (map = new Map()));
    if (!map.has(name)) map.set(name, this.gl.getUniformLocation(p, name));
    return map.get(name)!;
  }
  private set1i(p: WebGLProgram, n: string, v: number) {
    this.gl.uniform1i(this.loc(p, n), v);
  }
  private set1f(p: WebGLProgram, n: string, v: number) {
    this.gl.uniform1f(this.loc(p, n), v);
  }
  private set2f(p: WebGLProgram, n: string, a: number, b: number) {
    this.gl.uniform2f(this.loc(p, n), a, b);
  }
  private set3f(p: WebGLProgram, n: string, v: readonly [number, number, number]) {
    this.gl.uniform3f(this.loc(p, n), v[0], v[1], v[2]);
  }
}
