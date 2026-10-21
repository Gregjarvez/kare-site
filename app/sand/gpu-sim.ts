import { GROOVE_DEPTH, SAND_OFFSET, SHOULDER_HEIGHT } from "./kare/constants";

export const SIM_FLOATS = 12;

export const SIM_WGSL = /* wgsl */ `
struct Sim {
  cell: f32,
  rSand: f32,
  front: f32,
  a0: f32,
  sweep: f32,
  decay: f32,
  reveal: f32,
  stampText: f32,
  stampStroke: f32,
  hub: f32,
  seed: f32,
  pad: f32,
};

@group(0) @binding(0) var<uniform> s: Sim;
@group(0) @binding(1) var prev: texture_2d<f32>;
@group(0) @binding(2) var words: texture_2d<f32>;
@group(0) @binding(3) var stroke: texture_2d<f32>;
@group(0) @binding(4) var lin: sampler;

const GROOVE = ${GROOVE_DEPTH.toFixed(3)};
const SHOULDER = ${SHOULDER_HEIGHT.toFixed(3)};
const OFFSET = ${SAND_OFFSET.toFixed(3)};
const PITCH = 7.0;
const TOOTH = 2.4;
const TOOTH_DEPTH = 0.35;
const PI = 3.14159265;

@vertex
fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let uv = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  return vec4f(uv * 2.0 - 1.0, 0.0, 1.0);
}

fn hash(n: f32) -> f32 {
  return fract(sin(n * 127.1 + s.seed * 311.7) * 43758.5453);
}

fn rake(r: f32) -> f32 {
  let i = floor(r / PITCH);
  var h = 0.0;
  for (var k = -1; k <= 1; k++) {
    let j = i + f32(k);
    let centre = (j + 0.5 + 0.25 * (hash(j) - 0.5)) * PITCH;
    let depth = select(TOOTH_DEPTH * (0.6 + 0.8 * hash(j + 31.0)), 0.0, hash(j + 57.0) < 0.06);
    let w = TOOTH * (0.75 + 0.5 * hash(j + 13.0));
    let x = (r - centre) / w;
    let y = (abs(r - centre) - 1.7 * w) / (0.9 * w);
    h += -depth * exp(-x * x) + 0.4 * depth * exp(-y * y);
  }
  return h;
}

fn hash2(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.xyx) * 0.1031 + s.seed * 0.013);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn smooth2(p: vec2f) -> f32 {
  let i = floor(p);
  let f = p - i;
  let w = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2f(1.0, 0.0)), w.x), mix(hash2(i + vec2f(0.0, 1.0)), hash2(i + vec2f(1.0, 1.0)), w.x), w.y);
}

fn rough(d: vec2f) -> f32 {
  return (smooth2(d / 1.1) - 0.5) * 0.7 + (smooth2(d / 3.2 + 17.0) - 0.5) * 0.6 + (smooth2(d / 14.0 + 41.0) - 0.5) * 0.5;
}

fn mark(uv: vec2f) -> f32 {
  let w = textureSampleLevel(words, lin, uv, 0.0);
  let t = w.a * step(w.g, s.reveal) * s.stampText;
  return max(t, textureSampleLevel(stroke, lin, uv, 0.0).a * s.stampStroke);
}

fn disturbance(ij: vec2i) -> f32 {
  return textureLoad(prev, ij, 0).g;
}

@fragment
fn fs(@builtin(position) frag: vec4f) -> @location(0) vec4f {
  let size = vec2f(textureDimensions(prev));
  let ij = vec2i(frag.xy);
  let d = (frag.xy - size * 0.5) * s.cell;
  let r = length(d);

  var D = disturbance(ij);
  let around = disturbance(ij + vec2i(1, 0)) + disturbance(ij - vec2i(1, 0))
    + disturbance(ij + vec2i(0, 1)) + disturbance(ij - vec2i(0, 1));
  D += 0.006 * (around * 0.25 - D);

  let a = atan2(d.y, d.x) - s.a0;
  let t = a - PI * floor(a / PI);
  if (t < s.sweep && r > s.front * s.rSand) {
    D *= 1.0 - s.decay;
  }

  if (s.stampText + s.stampStroke > 0.0) {
    let uv = frag.xy / size;
    let m = mark(uv);
    var b = 0.0;
    for (var i = 0; i < 12; i++) {
      let ang = f32(i) * 0.5235988;
      let dir = vec2f(cos(ang), sin(ang)) / (size * s.cell);
      b += mark(uv + dir * 2.4) * 0.6 + mark(uv + dir * 5.0) * 0.4;
    }
    b /= 12.0;
    let ridge = max(b - m, 0.0);
    if (m > 0.04) {
      D = min(D, -GROOVE * m);
    } else if (ridge > 0.0 && D > -0.4) {
      D = max(D, SHOULDER * ridge * 1.8);
    }
  }

  D = clamp(D, -GROOVE * 1.2, 2.5);
  if (r > s.rSand - 0.5) {
    D = 0.0;
  }
  let settled = 1.0 - smoothstep(0.4, 1.8, abs(D));
  let h = rake(r) * settled * smoothstep(s.hub * 0.9, s.hub * 1.5, r) + D + rough(d);
  return vec4f(h + OFFSET, D, 0.0, 1.0);
}
`;
