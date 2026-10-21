export const QUAD_VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const SIM_FS = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform sampler2D uText;
uniform sampler2D uStroke;
uniform vec2 uTexel;
uniform float uReveal;
uniform float uStampText;
uniform float uStampStroke;
uniform float uA0;
uniform float uSweep;
uniform float uFront;
uniform float uDecay;
uniform float uRelax;
uniform float uEncoded;
in vec2 vUv;
out vec4 o;

float dec(vec4 c) { return uEncoded > 0.5 ? c.r * 2.7 - 1.5 : c.r; }
vec4 enc(float d) { return uEncoded > 0.5 ? vec4((d + 1.5) / 2.7, 0.0, 0.0, 1.0) : vec4(d, 0.0, 0.0, 1.0); }

float textAt(vec2 uv) {
  vec4 s = texture(uText, uv);
  return s.a * step(s.g, uReveal) * uStampText;
}
float strokeAt(vec2 uv) { return texture(uStroke, uv).a * uStampStroke; }
float markAt(vec2 uv) { return max(textAt(uv), strokeAt(uv)); }

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float d = dec(texture(uState, vUv));
  float n = dec(texture(uState, vUv + vec2(uTexel.x, 0.0))) + dec(texture(uState, vUv - vec2(uTexel.x, 0.0)))
          + dec(texture(uState, vUv + vec2(0.0, uTexel.y))) + dec(texture(uState, vUv - vec2(0.0, uTexel.y)));
  d += uRelax * (n * 0.25 - d);

  float a = atan(p.y, p.x);
  float t = mod(a - uA0, 3.14159265);
  if (t < uSweep && r > uFront) d *= 1.0 - uDecay;

  if (uStampText + uStampStroke > 0.0) {
    float m = markAt(vUv);
    float b = 0.0;
    for (int i = 0; i < 12; i++) {
      float ang = float(i) * 0.5235988;
      vec2 dir = vec2(cos(ang), sin(ang)) * uTexel;
      b += markAt(vUv + dir * 2.0) * 0.6 + markAt(vUv + dir * 4.5) * 0.4;
    }
    b /= 12.0;
    float ridge = max(b - m, 0.0);
    if (m > 0.04) d = min(d, -m);
    else if (ridge > 0.0 && d > -0.12) d = max(d, ridge * 1.1);
  }

  d = clamp(d, -1.5, 1.2);
  if (r > 0.995) d = 0.0;
  o = enc(d);
}`;

export const SCENE_FS = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uScale;
uniform float uElev;
uniform float uYaw;
uniform float uRod;
uniform float uNight;
uniform float uTime;
uniform float uEncoded;
uniform vec2 uTexel;
uniform vec3 uSand;
uniform vec3 uSandTint;
uniform vec3 uSandDark;
uniform vec3 uSandClear;
uniform float uSparkle;
uniform float uGrain;
uniform vec3 uTop;
uniform vec3 uTopBands;
uniform vec3 uWall;
uniform vec3 uWallBands;
uniform float uPores;
uniform vec3 uRodTint;
uniform float uRodGloss;
uniform float uRodShine;
in vec2 vUv;
out vec4 o;

const float RIN = 1.0;
const float ROUT = 1.16;
const float HR = 0.055;
const float HB = 0.15;
const float ROD_Y = 0.035;
const float ROD_R = 0.0125;
const float HUB_R = 0.062;
const float HUB_Y = 0.05;

float sstep(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float dec(vec4 c) { return uEncoded > 0.5 ? c.r * 2.7 - 1.5 : c.r; }
float stateAt(vec2 p) { return dec(texture(uState, p * 0.5 + 0.5)); }

vec3 lightDir() { return normalize(mix(vec3(-0.55, 0.72, -0.62), vec3(-0.75, 0.5, -0.35), uNight)); }
vec3 lightCol(vec2 pw) {
  vec3 day = vec3(1.04, 1.0, 0.93);
  float pool = 0.35 + 0.95 * exp(-dot(pw - vec2(-0.25, -0.2), pw - vec2(-0.25, -0.2)) * 0.55);
  vec3 lamp = vec3(1.0, 0.68, 0.4) * pool;
  return mix(day, lamp, uNight);
}
vec3 ambient() { return mix(vec3(0.52, 0.51, 0.5), vec3(0.08, 0.075, 0.09), uNight); }

float segDist(vec2 p, vec2 a, vec2 b, out float h) {
  vec2 pa = p - a, ba = b - a;
  h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

vec3 wood(vec2 p, vec3 a, vec3 b, float pores) {
  vec2 g = rot(0.35) * p;
  float warp = fbm(g * vec2(1.6, 6.0)) * 1.4;
  float bands = sin(g.y * 46.0 + warp * 6.0 + fbm(g * 3.0) * 2.0);
  float t = sstep(-0.4, 1.0, bands) * 0.8 + fbm(g * vec2(0.8, 14.0)) * 0.25;
  vec3 c = mix(a, b, clamp(t, 0.0, 1.0));
  float pore = sstep(0.72, 0.95, noise(g * vec2(40.0, 340.0)));
  return c * (1.0 - pore * 0.12 * pores);
}

vec3 shadeSurface(vec3 base, vec3 n, vec2 pw, float gloss, float spec) {
  vec3 L = lightDir();
  vec3 V = vec3(0.0, cos(uElev), sin(uElev));
  float diff = max(dot(n, L), 0.0);
  vec3 H = normalize(L + V);
  float s = pow(max(dot(n, H), 0.0), gloss) * spec;
  vec3 lc = lightCol(pw);
  return base * (ambient() + diff * lc * 0.78) + s * lc;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 q = (frag - uCenter) / uScale;
  float sE = sin(uElev), cE = cos(uElev);
  float px = 1.0 / uScale;
  vec3 L = lightDir();
  vec2 lOff = L.xz / L.y;

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  {
    vec2 pt = vec2(q.x, (q.y - HB * cE) / sE);
    float soft = sstep(ROUT + 0.16, ROUT - 0.22, length(pt + lOff * (HR + HB) * 0.55));
    float contact = sstep(ROUT + 0.07, ROUT - 0.03, length(pt));
    float sh = mix(soft * 0.22 + contact * 0.28, soft * 0.4 + contact * 0.35, uNight);
    alpha = sh;
  }

  if (abs(q.x) < ROUT) {
    float z = sqrt(ROUT * ROUT - q.x * q.x);
    float y = (z * sE - q.y) / cE;
    float cov = sstep(-HB - px * 1.5 / cE, -HB + px * 0.5 / cE, y) * (1.0 - sstep(HR - px / cE, HR + px / cE, y));
    cov *= sstep(ROUT, ROUT - px * 2.0, abs(q.x));
    if (cov > 0.0) {
      vec3 n = normalize(vec3(q.x, 0.0, z));
      float ang = atan(z, q.x) + uYaw;
      vec2 wp = vec2(ang * 1.4, y * 5.0);
      vec3 base = wood(vec2(wp.x, wp.y * 0.25 + 0.3), uWall, uWallBands, uPores);
      float edgeTop = sstep(HR - 0.02, HR, y);
      float edgeBot = sstep(-HB + 0.035, -HB, y);
      n = normalize(n + vec3(0.0, edgeTop * 0.9 - edgeBot * 0.7, 0.0));
      vec3 c = shadeSurface(base, n, vec2(q.x, z), 22.0, 0.08 * uPores + 0.03);
      c *= 1.0 - edgeBot * 0.35;
      col = mix(col, c, cov);
      alpha = mix(alpha, 1.0, cov);
    }
  }

  vec2 pw = vec2(q.x, q.y / sE);
  float rw = length(pw);
  float sandCov = sstep(RIN + px, RIN - px, rw);
  if (sandCov > 0.0) {
    vec2 p = rot(-uYaw) * pw;
    float r = length(p);
    float d = stateAt(p);
    float e = uTexel.x * 2.0;
    float dx = (stateAt(p + vec2(e, 0.0)) - stateAt(p - vec2(e, 0.0))) / (2.0 * e);
    float dz = (stateAt(p + vec2(0.0, e)) - stateAt(p - vec2(0.0, e))) / (2.0 * e);

    float K = 6.2831853 * 15.0;
    float flat_ = 1.0 - sstep(0.08, 0.7, abs(d));
    float ringMask = sstep(0.1, 0.16, r) * sstep(1.0, 0.95, r) * flat_;
    float A = 0.0042;
    float rk = -A * K * sin(r * K) * ringMask;
    vec2 rg = r > 0.0001 ? p / r * rk : vec2(0.0);

    float HD = 0.028;
    vec2 grad = vec2(dx, dz) * HD + rg;

    vec2 cell = floor(p * 270.0 / uGrain);
    float h = hash(cell);
    vec2 h2 = hash2(cell + 17.0);
    vec2 jit = (h2 - 0.5) * 0.55;
    vec3 n = normalize(vec3(-grad.x + jit.x * 0.35, 1.0, -grad.y + jit.y * 0.35));
    n.xz = rot(uYaw) * n.xz;

    vec3 base = uSand * (0.9 + 0.2 * hash(cell + 3.1));
    if (h < 0.1) base = uSandTint;
    else if (h < 0.135) base = uSandDark;
    float clear_ = step(0.985, h);
    base = mix(base, uSandClear, clear_ * 0.5);
    base *= 0.94 + 0.12 * noise(p * 9.0);

    float ao = clamp(1.0 + d * 0.22, 0.6, 1.08);
    ao *= mix(1.0, 0.82, sstep(0.88, 1.0, rw));

    vec2 qr = pw + lOff * HR;
    float rimShade = sstep(RIN - 0.015, RIN + 0.04, length(qr));

    float phi = uRod + uYaw;
    vec2 dir = vec2(cos(phi), sin(phi)) * 0.985;
    vec2 so = -lOff * ROD_Y;
    float hh;
    float ds = segDist(pw, -dir - so, dir - so, hh);
    float rodShade = sstep(ROD_R * 2.6, ROD_R * 0.4, ds) * 0.5;
    float hubShade = sstep(HUB_R * 1.5, HUB_R * 0.7, length(pw + lOff * HUB_Y)) * 0.55;

    float lit = 1.0 - max(rimShade * 0.75, max(rodShade, hubShade));

    vec3 V = vec3(0.0, cE, sE);
    vec3 lc = lightCol(pw);
    float diff = max(dot(n, L), 0.0) * lit;
    float spark = clear_ * pow(max(dot(reflect(-L, n), V), 0.0), 24.0) * uSparkle * 2.2 * lit;
    vec3 c = base * (ambient() * ao + diff * lc * 0.8 * ao) + spark * lc;
    col = mix(col, c, sandCov);
    alpha = mix(alpha, 1.0, sandCov);
  }

  if (abs(q.x) < RIN) {
    float z = -sqrt(RIN * RIN - q.x * q.x);
    float y = (z * sE - q.y) / cE;
    float cov = sstep(-px / cE, px / cE, y) * (1.0 - sstep(HR - px / cE, HR + px / cE, y));
    if (cov > 0.0) {
      vec3 n = normalize(vec3(-q.x, 0.0, -z));
      float ang = atan(z, q.x) + uYaw;
      vec3 base = wood(vec2(ang * 1.4, y * 1.25 + 0.7), uWall, uWallBands, uPores);
      vec3 c = shadeSurface(base, n, vec2(q.x, z), 22.0, 0.04) * mix(0.72, 1.0, sstep(0.0, HR, y));
      col = mix(col, c, cov);
      alpha = mix(alpha, 1.0, cov);
    }
  }

  {
    float phi = uRod + uYaw;
    vec3 axis = vec3(cos(phi), 0.0, sin(phi));
    vec2 a = vec2(axis.x * 0.985, axis.z * 0.985 * sE - ROD_Y * cE);
    vec2 b = vec2(-axis.x * 0.985, -axis.z * 0.985 * sE - ROD_Y * cE);
    float hh;
    float dist = segDist(q, a, b, hh);
    float cov = sstep(ROD_R + px, ROD_R - px, dist);
    if (cov > 0.0) {
      vec2 sd = normalize(b - a);
      vec2 perp = vec2(-sd.y, sd.x);
      float across = clamp(dot(q - mix(a, b, hh), perp) / ROD_R, -1.0, 1.0);
      vec3 V = vec3(0.0, cE, sE);
      vec3 wperp = normalize(V - dot(V, axis) * axis);
      vec3 side = normalize(cross(axis, wperp));
      if (dot(vec2(side.x, side.z * sE - side.y * cE), perp) < 0.0) side = -side;
      vec3 n = normalize(wperp * sqrt(1.0 - across * across) + side * across);
      float brushed = 0.92 + 0.08 * noise(vec2(hh * 400.0, across * 3.0));
      vec3 c = shadeSurface(uRodTint * 0.62 * brushed, n, q, uRodGloss * 3.0, uRodShine * 0.9);
      col = mix(col, c, cov);
      alpha = mix(alpha, 1.0, cov);
    }
  }

  {
    vec2 hp = vec2(q.x, (q.y + HUB_Y * cE) / sE);
    float hr = length(hp);
    float cov = sstep(HUB_R + px / sE, HUB_R - px / sE, hr);
    if (cov > 0.0) {
      vec3 n = normalize(vec3(hp.x / HUB_R * 0.9, 1.0, hp.y / HUB_R * 0.9));
      vec3 c = shadeSurface(uRodTint * 0.6, n, hp, uRodGloss * 3.0, uRodShine);
      c *= 1.0 - sstep(HUB_R * 0.75, HUB_R, hr) * 0.25;
      col = mix(col, c, cov);
      alpha = mix(alpha, 1.0, cov);
    }
  }

  {
    vec2 tp = vec2(q.x, (q.y + HR * cE) / sE);
    float tr = length(tp);
    float cov = sstep(RIN - px, RIN + px, tr) * sstep(ROUT + px, ROUT - px, tr);
    if (cov > 0.0) {
      float t = (tr - RIN) / (ROUT - RIN);
      float bevel = -0.9 * (1.0 - sstep(0.0, 0.22, t)) + 0.9 * sstep(0.78, 1.0, t);
      vec2 radial = tp / tr;
      vec3 n = normalize(vec3(radial.x * bevel, 1.0, radial.y * bevel));
      vec2 lp = rot(-uYaw) * tp;
      vec3 base = wood(lp, uTop, uTopBands, uPores);
      vec3 c = shadeSurface(base, n, tp, 30.0, 0.1 * uPores + 0.05);
      col = mix(col, c, cov);
      alpha = mix(alpha, 1.0, cov);
    }
  }

  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0 * alpha;
  o = vec4(col, alpha);
}`;
