import { RIM_HEIGHT, SURFACE_MARGIN, TABLE_Z } from "./kare/constants";
import { keyLightAt } from "./kare/daylight";
import {
  DEPTH_FORMAT,
  GRAIN_FORMAT,
  GRAIN_PERIOD,
  GRAIN_TEXELS,
  SCENE_WGSL,
  SLOT,
  STILL,
  UNIFORM_FLOATS,
} from "./kare/scene-shader";
import { SIM_FLOATS, SIM_WGSL } from "./gpu-sim";
import type { Look } from "./looks";
import { PassClock } from "./pass-clock";
import { drawStroke, drawWords } from "./text-stamp";
import { loadHandFont, tidy, type Tray, type TrayOptions } from "./tray";

const SIM = 512;
const SAND_SHARE = 0.915;
const TILT = (40 * Math.PI) / 180;
const PERSPECTIVE = 1600;
const SHADOW_SPACE = 60;
const ROD_SPEED = (Math.PI * 2) / 11;
const MARBLE_FLOATS = 32;

type Pose = { x: number; y: number; scale: number; tilt: number; perspective: number };

function project(pose: Pose, x: number, y: number, z: number) {
  const ct = Math.cos(pose.tilt);
  const st = Math.sin(pose.tilt);
  const wy = pose.scale * y;
  const wz = pose.scale * z;
  const k = pose.perspective / (pose.perspective - (st * wy + ct * wz));
  return { x: pose.x + pose.scale * x * k, y: pose.y + (ct * wy - st * wz) * k };
}

function sandUnder(x: number, y: number, pose: Pose) {
  const ct = Math.cos(pose.tilt);
  const st = Math.sin(pose.tilt);
  const down = y - pose.y;
  const k = pose.perspective / (pose.perspective * ct + st * down) / pose.scale;
  return { x: (x - pose.x) * ct * k, y: down * k };
}

function texture(device: GPUDevice, size: number, format: GPUTextureFormat, usage: number) {
  return device.createTexture({ size: [size, size], format, usage });
}

export class GpuTray implements Tray {
  readonly kind = "gpu";
  static async create(canvas: HTMLCanvasElement, options: TrayOptions) {
    if (!("gpu" in navigator)) return null;
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return null;
    const device = await adapter.requestDevice();
    const format = navigator.gpu.getPreferredCanvasFormat();
    const tray = new GpuTray(canvas, device, format, options);
    const context = canvas.getContext("webgpu");
    if (!context) {
      device.destroy();
      return null;
    }
    context.configure({ device, format, alphaMode: "premultiplied" });
    tray.context = context;
    device.lost.then((info) => {
      if (info.reason !== "destroyed") options.onFail?.();
    });
    return tray;
  }

  private context: GPUCanvasContext | null = null;
  private uniforms: GPUBuffer;
  private uniformData = new Float32Array(UNIFORM_FLOATS);
  private simUniforms: GPUBuffer;
  private simData = new Float32Array(SIM_FLOATS);
  private fields: [GPUTexture, GPUTexture];
  private simGroups: [GPUBindGroup, GPUBindGroup];
  private sourceGroups: [GPUBindGroup, GPUBindGroup];
  private words: GPUTexture;
  private strokes: GPUTexture;
  private grainTexture: GPUTexture;
  private grainSampler: GPUSampler;
  private sampler: GPUSampler;
  private simPipeline: GPURenderPipeline;
  private surfacePipeline: GPURenderPipeline;
  private scenePipeline: GPURenderPipeline;
  private surfaceLayout: GPUBindGroupLayout;
  private surface: { texture: GPUTexture; view: GPUTextureView; group: GPUBindGroup } | null = null;
  private depth: GPUTexture | null = null;
  private textCanvas = document.createElement("canvas");
  private strokeCanvas = document.createElement("canvas");
  private clock: PassClock;
  private look: Look;
  private seed = Math.random() * 100;
  private raf = 0;
  private last = 0;
  private running = false;
  private rod = 0.6;
  private mood = 0;
  private moodTarget = 0;
  private tilt = TILT;
  private tiltTarget = TILT;
  private lean = 0;
  private leanTarget = 0;
  private reveal = 2;
  private stampText = false;
  private strokeDirty = false;
  private lastStroke: [number, number] | null = null;
  private width = 1;
  private height = 1;
  private px = 1;
  private rOuter = 200;
  private pose: Pose = { x: 0, y: 0, scale: 1, tilt: TILT, perspective: PERSPECTIVE };
  private cell = 1;

  private constructor(
    private canvas: HTMLCanvasElement,
    private device: GPUDevice,
    private format: GPUTextureFormat,
    options: TrayOptions,
  ) {
    this.look = options.look;
    this.mood = this.moodTarget = options.night ? 1 : 0;
    this.clock = new PassClock(options.onPhase);
    for (const c of [this.textCanvas, this.strokeCanvas]) {
      c.width = SIM;
      c.height = SIM;
    }

    const usage = GPUTextureUsage;
    const scene = device.createShaderModule({ code: SCENE_WGSL });
    const sim = device.createShaderModule({ code: SIM_WGSL });
    this.sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });
    this.grainSampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "repeat",
      addressModeV: "repeat",
    });

    const sourceLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
      ],
    });
    this.surfaceLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
      ],
    });
    const simLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
      ],
    });

    this.simPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [simLayout] }),
      vertex: { module: sim, entryPoint: "vs" },
      fragment: { module: sim, entryPoint: "fs", targets: [{ format: "rgba16float" }] },
      primitive: { topology: "triangle-list" },
    });
    this.surfacePipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [sourceLayout] }),
      vertex: { module: scene, entryPoint: "vs" },
      fragment: { module: scene, entryPoint: "fsSurface", targets: [{ format: "r16float" }] },
      primitive: { topology: "triangle-list" },
    });
    this.scenePipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [sourceLayout, this.surfaceLayout] }),
      vertex: { module: scene, entryPoint: "vs" },
      fragment: { module: scene, entryPoint: "fs", targets: [{ format }] },
      primitive: { topology: "triangle-list" },
      depthStencil: { format: DEPTH_FORMAT, depthWriteEnabled: true, depthCompare: "always" },
    });

    this.uniforms = device.createBuffer({
      size: UNIFORM_FLOATS * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.simUniforms = device.createBuffer({
      size: SIM_FLOATS * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const marble = device.createBuffer({ size: MARBLE_FLOATS * 4, usage: GPUBufferUsage.UNIFORM });
    const carvings = texture(device, 1, "r8unorm", usage.TEXTURE_BINDING);

    const fieldUsage = usage.RENDER_ATTACHMENT | usage.TEXTURE_BINDING;
    this.fields = [texture(device, SIM, "rgba16float", fieldUsage), texture(device, SIM, "rgba16float", fieldUsage)];
    const stampUsage = usage.TEXTURE_BINDING | usage.COPY_DST | usage.RENDER_ATTACHMENT;
    this.words = texture(device, SIM, "rgba8unorm", stampUsage);
    this.strokes = texture(device, SIM, "rgba8unorm", stampUsage);

    const simGroup = (from: GPUTexture) =>
      device.createBindGroup({
        layout: simLayout,
        entries: [
          { binding: 0, resource: { buffer: this.simUniforms } },
          { binding: 1, resource: from.createView() },
          { binding: 2, resource: this.words.createView() },
          { binding: 3, resource: this.strokes.createView() },
          { binding: 4, resource: this.sampler },
        ],
      });
    this.simGroups = [simGroup(this.fields[0]), simGroup(this.fields[1])];
    const sourceGroup = (field: GPUTexture) =>
      device.createBindGroup({
        layout: sourceLayout,
        entries: [
          { binding: 0, resource: { buffer: this.uniforms } },
          { binding: 1, resource: this.sampler },
          { binding: 2, resource: field.createView() },
          { binding: 3, resource: { buffer: marble } },
          { binding: 4, resource: carvings.createView() },
        ],
      });
    this.sourceGroups = [sourceGroup(this.fields[0]), sourceGroup(this.fields[1])];

    this.grainTexture = this.bakeGrains(scene);
    this.clearField();
  }

  setLook(look: Look) {
    this.look = look;
    if (!this.running) this.frame(this.last);
  }

  setNight(night: boolean) {
    this.moodTarget = night ? 1 : 0;
  }

  setTilt(x: number, y: number) {
    this.leanTarget = x;
    this.tiltTarget = TILT - y * 0.05;
  }

  async inscribe(text: string, passSeconds = 24) {
    const words = tidy(text);
    if (!words) return;
    await loadHandFont();
    const rSand = this.rOuter * SAND_SHARE;
    drawWords(
      this.textCanvas,
      words,
      {
        cx: SIM / 2,
        cy: SIM / 2,
        width: (rSand * 1.55) / this.cell,
        height: (rSand * 1.25) / this.cell,
      },
      0.035,
    );
    this.device.queue.copyExternalImageToTexture(
      { source: this.textCanvas },
      { texture: this.words, premultipliedAlpha: false },
      [SIM, SIM],
    );
    this.clearField();
    this.clock.begin(words.length, passSeconds);
  }

  pointerDown(clientX: number, clientY: number) {
    const at = this.toField(clientX, clientY);
    if (!at) return false;
    this.lastStroke = at;
    this.strokeTo(at);
    return true;
  }

  pointerMove(clientX: number, clientY: number) {
    if (!this.lastStroke) return;
    const at = this.toField(clientX, clientY);
    if (!at) {
      this.lastStroke = null;
      return;
    }
    this.strokeTo(at);
  }

  pointerUp() {
    this.lastStroke = null;
  }

  hitsSand(clientX: number, clientY: number) {
    return this.toField(clientX, clientY) !== null;
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
    this.context?.unconfigure();
    this.device.destroy();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.px = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.px);
    this.canvas.height = Math.round(this.height * this.px);
    this.fit();
    this.depth?.destroy();
    this.depth = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: DEPTH_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    if (!this.running) this.frame(this.last);
  }

  private fit() {
    const upright: Pose = { x: 0, y: 0, scale: 1, tilt: TILT, perspective: PERSPECTIVE };
    let r = Math.min(this.width, this.height) / 2;
    for (let i = 0; i < 5; i++) {
      const far = -project(upright, 0, -r, RIM_HEIGHT).y;
      const near = project(upright, 0, r, TABLE_Z).y + SHADOW_SPACE;
      let wide = 0;
      for (let a = 0; a <= Math.PI / 2; a += Math.PI / 32)
        wide = Math.max(wide, 2 * project(upright, r * Math.cos(a), r * Math.sin(a), RIM_HEIGHT).x);
      r *= Math.min((this.width * 0.86) / wide, (this.height * 0.94) / (far + near));
    }
    const far = -project(upright, 0, -r, RIM_HEIGHT).y;
    const near = project(upright, 0, r, TABLE_Z).y + SHADOW_SPACE;
    this.rOuter = r;
    this.pose = { ...upright, x: this.width / 2 - r * 0.03, y: this.height / 2 + (far - near) / 2 };
    const rSand = r * SAND_SHARE;
    this.cell = (2 * (rSand + SURFACE_MARGIN + 6)) / SIM;
    const extent = rSand + SURFACE_MARGIN;
    const size = Math.ceil(2 * extent * Math.min(2, this.px));
    if (this.surface?.texture.width !== size) {
      this.surface?.texture.destroy();
      const surface = texture(
        this.device,
        size,
        "r16float",
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      );
      const view = surface.createView();
      this.surface = {
        texture: surface,
        view,
        group: this.device.createBindGroup({
          layout: this.surfaceLayout,
          entries: [
            { binding: 0, resource: view },
            { binding: 1, resource: this.grainTexture.createView() },
            { binding: 2, resource: this.grainSampler },
          ],
        }),
      };
    }
  }

  private frame(now: number) {
    if (!this.context || !this.surface || !this.depth) return;
    const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    const ease = 1 - Math.exp(-dt * 3);
    this.tilt += (this.tiltTarget - this.tilt) * ease;
    this.lean += (this.leanTarget - this.lean) * ease;
    this.mood += (this.moodTarget - this.mood) * (1 - Math.exp(-dt * 1.6));
    const a0 = this.rod;
    const sweep = ROD_SPEED * dt;
    this.rod = (this.rod + sweep) % (Math.PI * 2);
    const pass = this.clock.tick(dt);
    this.reveal = pass.reveal;
    this.stampText = pass.stampText;

    const strokeOn = this.strokeDirty;
    if (strokeOn) {
      this.device.queue.copyExternalImageToTexture(
        { source: this.strokeCanvas },
        { texture: this.strokes, premultipliedAlpha: false },
        [SIM, SIM],
      );
      this.strokeDirty = false;
      this.strokeCanvas.getContext("2d")!.clearRect(0, 0, SIM, SIM);
    }

    const rSand = this.rOuter * SAND_SHARE;
    const s = this.simData;
    s[0] = this.cell;
    s[1] = rSand;
    s[2] = pass.front;
    s[3] = a0;
    s[4] = sweep;
    s[5] = pass.decay;
    s[6] = this.reveal;
    s[7] = this.stampText ? 1 : 0;
    s[8] = strokeOn ? 1 : 0;
    s[9] = rSand * 0.09;
    s[10] = this.seed;
    this.device.queue.writeBuffer(this.simUniforms, 0, s);
    this.writeScene(rSand);

    const encoder = this.device.createCommandEncoder();
    const simPass = encoder.beginRenderPass({
      colorAttachments: [{ view: this.fields[1].createView(), loadOp: "clear", storeOp: "store" }],
    });
    simPass.setPipeline(this.simPipeline);
    simPass.setBindGroup(0, this.simGroups[0]);
    simPass.draw(3);
    simPass.end();

    const surfacePass = encoder.beginRenderPass({
      colorAttachments: [{ view: this.surface.view, loadOp: "clear", storeOp: "store" }],
    });
    surfacePass.setPipeline(this.surfacePipeline);
    surfacePass.setBindGroup(0, this.sourceGroups[1]);
    surfacePass.draw(3);
    surfacePass.end();

    const scenePass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: [0, 0, 0, 0],
        },
      ],
      depthStencilAttachment: {
        view: this.depth.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "discard",
      },
    });
    scenePass.setPipeline(this.scenePipeline);
    scenePass.setBindGroup(0, this.sourceGroups[1]);
    scenePass.setBindGroup(1, this.surface.group);
    scenePass.draw(3);
    scenePass.end();
    this.device.queue.submit([encoder.finish()]);

    this.fields.reverse();
    this.simGroups.reverse();
    this.sourceGroups.reverse();
  }

  private writeScene(rSand: number) {
    const u = this.uniformData;
    const { sand, tray, rod } = this.look;
    const light = keyLightAt(new Date().getHours() + new Date().getMinutes() / 60);
    const extent = rSand + SURFACE_MARGIN;
    const pose = { ...this.pose, tilt: this.tilt, x: this.pose.x + this.lean * 6 };
    u[SLOT.size] = this.width;
    u[SLOT.size + 1] = this.height;
    u[SLOT.center] = this.width / 2;
    u[SLOT.center + 1] = this.height / 2;
    u[SLOT.rSand] = rSand;
    u[SLOT.rOuter] = this.rOuter;
    u[SLOT.px] = this.px;
    u[SLOT.mood] = this.mood;
    u[SLOT.armAngle] = this.rod;
    u[SLOT.armLen] = rSand - 1;
    u[SLOT.armR] = Math.max(2.4, rSand * 0.017);
    u[SLOT.hubR] = rSand * 0.09;
    u[SLOT.cell] = this.cell;
    u[SLOT.bins] = SIM / 2;
    u[SLOT.level] = 0;
    u[SLOT.surfaceScale] = (this.surface?.texture.width ?? 1) / (2 * extent);
    u[SLOT.camScale] = pose.scale;
    u[SLOT.camTilt] = pose.tilt;
    u[SLOT.camCenter] = pose.x;
    u[SLOT.camCenter + 1] = pose.y;
    u[SLOT.persp] = pose.perspective;
    u[SLOT.shiftX] = 0;
    u[SLOT.light] = light.x;
    u[SLOT.light + 1] = light.y;
    u[SLOT.light + 2] = light.z;
    u[SLOT.tanElev] = light.tanElevation;
    u[SLOT.lightDir] = light.flatX;
    u[SLOT.lightDir + 1] = light.flatY;
    u[SLOT.show] = 1;
    u[SLOT.still] = STILL.shadowed;
    u.set(sand.colour, SLOT.sandColour);
    u[SLOT.sandColour + 3] = sand.grain;
    u.set(sand.tinted, SLOT.sandTinted);
    u.set(sand.dark, SLOT.sandDark);
    u.set(sand.clear, SLOT.sandClear);
    u[SLOT.sandClear + 3] = sand.sparkle;
    u.set(tray.top, SLOT.trayTop);
    u[SLOT.trayTop + 3] = tray.pores;
    u.set(tray.topBands, SLOT.trayTopBands);
    u.set(tray.wall, SLOT.trayWall);
    u.set(tray.wallBands, SLOT.trayWallBands);
    u[SLOT.roll] = 0;
    u[SLOT.rollAbout] = this.width / 2;
    u[SLOT.rollAbout + 1] = this.height / 2;
    u[SLOT.grainFloor] = 0;
    u[SLOT.rodTinted] = rod.id === "steel" ? 0 : 1;
    u[SLOT.rodGloss] = rod.gloss;
    u[SLOT.rodShine] = rod.shine;
    u.set(rod.tint, SLOT.rodTint);
    u[SLOT.rodWarmth] = rod.warmth;
    u[SLOT.rodBrushed] = rod.brushed;
    this.device.queue.writeBuffer(this.uniforms, 0, u);
  }

  private bakeGrains(module: GPUShaderModule) {
    const size = GRAIN_PERIOD * GRAIN_TEXELS;
    const grains = texture(
      this.device,
      size,
      GRAIN_FORMAT,
      GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    );
    const pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [] }),
      vertex: { module, entryPoint: "vs" },
      fragment: { module, entryPoint: "fsGrains", targets: [{ format: GRAIN_FORMAT }] },
      primitive: { topology: "triangle-list" },
    });
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{ view: grains.createView(), loadOp: "clear", storeOp: "store" }],
    });
    pass.setPipeline(pipeline);
    pass.draw(3);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
    return grains;
  }

  private clearField() {
    const encoder = this.device.createCommandEncoder();
    for (const field of this.fields) {
      encoder
        .beginRenderPass({
          colorAttachments: [{ view: field.createView(), loadOp: "clear", storeOp: "store", clearValue: [0, 0, 0, 1] }],
        })
        .end();
    }
    this.device.queue.submit([encoder.finish()]);
  }

  private toField(clientX: number, clientY: number): [number, number] | null {
    const rect = this.canvas.getBoundingClientRect();
    const d = sandUnder(clientX - rect.left, clientY - rect.top, { ...this.pose, tilt: this.tilt });
    if (Math.hypot(d.x, d.y) > this.rOuter * SAND_SHARE * 0.97) return null;
    return [d.x / this.cell + SIM / 2, d.y / this.cell + SIM / 2];
  }

  private strokeTo(at: [number, number]) {
    drawStroke(this.strokeCanvas, this.lastStroke ?? at, at, 7 / this.cell);
    this.lastStroke = at;
    this.strokeDirty = true;
  }
}
