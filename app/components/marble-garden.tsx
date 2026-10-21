import { useEffect, useRef, useState } from "react";

type Marble = { x: number; y: number; vx: number; vy: number; r: number; hue: [string, string, string]; born: number; seed: number };

const STONES: [string, string, string][] = [
  ["#f4ecdc", "#d9c8a6", "#8a7a62"],
  ["#f7f6f2", "#d6d5cf", "#86857f"],
  ["#76716b", "#45423f", "#1c1b1a"],
  ["#e09a73", "#b4694a", "#5e3020"],
  ["#f0d4bf", "#c9a891", "#7a5e4c"],
  ["#d9a27c", "#b07c59", "#5d3a26"],
  ["#e3e3e7", "#bcbbc0", "#6c6b70"],
  ["#5f5d5d", "#3c3a3a", "#141313"],
];

function makeMarble(i: number, seed: number, R: number, now: number, drop: boolean): Marble {
  const a = seed * 6.283;
  const d = drop ? R * 0.15 : R * (0.25 + ((seed * 7.31) % 0.6));
  return {
    x: Math.cos(a) * d,
    y: Math.sin(a) * d,
    vx: 0,
    vy: 0,
    r: R * 0.082,
    hue: STONES[i % STONES.length],
    born: drop ? now : -10,
    seed,
  };
}

export function MarbleGarden({ count }: { count: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const marbles = useRef<Marble[]>([]);
  const gravity = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const sizeRef = useRef({ w: 1, h: 1, dpr: 1, R: 1 });
  const [canTilt, setCanTilt] = useState(false);
  const [tilting, setTilting] = useState(false);

  useEffect(() => {
    setCanTilt(typeof DeviceOrientationEvent !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    const list = marbles.current;
    const { R } = sizeRef.current;
    const now = performance.now() / 1000;
    while (list.length < count) {
      const i = list.length;
      list.push(makeMarble(i, (i * 0.618034) % 1, R, now, i >= 9));
    }
  }, [count]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    let visible = false;
    let woodCache: HTMLCanvasElement | null = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      const oldR = sizeRef.current.R;
      const R = Math.min(w, h) * 0.42;
      canvas.width = w;
      canvas.height = h;
      sizeRef.current = { w, h, dpr, R };
      for (const m of marbles.current) {
        const k = R / oldR;
        m.x *= k;
        m.y *= k;
        m.r = R * 0.082;
      }
      woodCache = null;
    };

    const paintWood = () => {
      const { w, h, R } = sizeRef.current;
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d")!;
      const cx = w / 2;
      const cy = h / 2;
      const rim = R * 1.12;
      g.save();
      g.translate(cx, cy);
      g.fillStyle = "rgba(40, 26, 16, 0.28)";
      g.filter = `blur(${R * 0.06}px)`;
      g.beginPath();
      g.ellipse(R * 0.05, R * 0.09, rim, rim, 0, 0, Math.PI * 2);
      g.fill();
      g.filter = "none";
      const body = g.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.1, 0, 0, rim);
      body.addColorStop(0, "#94705a");
      body.addColorStop(0.7, "#6f4d37");
      body.addColorStop(1, "#4a3122");
      g.fillStyle = body;
      g.beginPath();
      g.arc(0, 0, rim, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < 60; i++) {
        const rr = (i / 60) * R;
        g.strokeStyle = `rgba(${i % 3 ? "40,24,14" : "190,150,120"}, ${i % 3 ? 0.09 : 0.06})`;
        g.lineWidth = R * 0.006;
        g.beginPath();
        g.arc(0, 0, rr, 0, Math.PI * 2);
        g.stroke();
      }
      g.strokeStyle = "rgba(30, 18, 10, 0.45)";
      g.lineWidth = R * 0.02;
      g.beginPath();
      g.arc(0, 0, R + R * 0.01, 0, Math.PI * 2);
      g.stroke();
      const lip = g.createLinearGradient(-rim, -rim, rim, rim);
      lip.addColorStop(0, "rgba(255, 230, 200, 0.22)");
      lip.addColorStop(1, "rgba(0, 0, 0, 0.25)");
      g.strokeStyle = lip;
      g.lineWidth = R * 0.11;
      g.beginPath();
      g.arc(0, 0, R * 1.065, 0, Math.PI * 2);
      g.stroke();
      const well = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.09);
      well.addColorStop(0, "#120b07");
      well.addColorStop(0.75, "#1d130c");
      well.addColorStop(1, "rgba(60, 40, 28, 0)");
      g.fillStyle = well;
      g.beginPath();
      g.arc(0, 0, R * 0.09, 0, Math.PI * 2);
      g.fill();
      g.restore();
      return c;
    };

    const step = (dt: number) => {
      const { R } = sizeRef.current;
      const gv = gravity.current;
      const k = 1 - Math.exp(-dt * 5);
      gv.x += (gv.tx - gv.x) * k;
      gv.y += (gv.ty - gv.y) * k;
      const G = R * 2.4;
      const list = marbles.current;
      for (const m of list) {
        m.vx += gv.x * G * dt;
        m.vy += gv.y * G * dt;
        const drag = Math.exp(-dt * 0.9);
        m.vx *= drag;
        m.vy *= drag;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const d = Math.hypot(m.x, m.y);
        const max = R - m.r;
        if (d > max) {
          const nx = m.x / d;
          const ny = m.y / d;
          m.x = nx * max;
          m.y = ny * max;
          const vn = m.vx * nx + m.vy * ny;
          if (vn > 0) {
            m.vx -= 1.45 * vn * nx;
            m.vy -= 1.45 * vn * ny;
          }
        }
      }
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const min = a.r + b.r;
          if (dist < min) {
            const nx = dx / dist;
            const ny = dy / dist;
            const push = (min - dist) / 2;
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
            const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rel < 0) {
              const imp = -rel * 0.92;
              a.vx -= imp * nx;
              a.vy -= imp * ny;
              b.vx += imp * nx;
              b.vy += imp * ny;
            }
          }
        }
      }
    };

    const draw = (now: number) => {
      const { w, h } = sizeRef.current;
      if (!woodCache) woodCache = paintWood();
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(woodCache, 0, 0);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      const t = now / 1000;
      for (const m of marbles.current) {
        const age = t - m.born;
        const s = age < 0.9 ? 1 - Math.pow(1 - Math.min(1, age / 0.9), 3) : 1;
        const r = m.r * (0.4 + 0.6 * s);
        ctx.globalAlpha = Math.min(1, s * 1.4);
        ctx.fillStyle = "rgba(20, 12, 6, 0.38)";
        ctx.beginPath();
        ctx.ellipse(m.x + r * 0.22, m.y + r * 0.3, r * 1.02, r * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();
        const g = ctx.createRadialGradient(m.x - r * 0.38, m.y - r * 0.42, r * 0.08, m.x, m.y, r);
        g.addColorStop(0, m.hue[0]);
        g.addColorStop(0.55, m.hue[1]);
        g.addColorStop(1, m.hue[2]);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.beginPath();
        ctx.ellipse(m.x - r * 0.36, m.y - r * 0.42, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (let i = 0; i < 2; i++) step(dt / 2);
      draw(now);
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const sync = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    const now = performance.now() / 1000;
    if (marbles.current.length === 0) {
      for (let i = 0; i < count; i++) marbles.current.push(makeMarble(i, (i * 0.618034) % 1, sizeRef.current.R, now, false));
    }
    draw(performance.now());
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    if (!tilting) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      const gx = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 30));
      const gy = Math.max(-1, Math.min(1, ((e.beta ?? 0) - 35) / 30));
      gravity.current.tx = gx;
      gravity.current.ty = gy;
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, [tilting]);

  const aim = (clientX: number, clientY: number) => {
    if (tilting) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((clientY - rect.top) / rect.height) * 2 - 1;
    gravity.current.tx = Math.max(-1, Math.min(1, x * 1.3));
    gravity.current.ty = Math.max(-1, Math.min(1, y * 1.3));
  };

  const askTilt = async () => {
    const Orientation = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      if (Orientation.requestPermission && (await Orientation.requestPermission()) !== "granted") return;
      setTilting(true);
    } catch {
      setTilting(false);
    }
  };

  return (
    <div className="marble-garden">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`A wooden garden holding ${count} marbles, one for each thought let go`}
        onPointerMove={(e) => aim(e.clientX, e.clientY)}
        onPointerDown={(e) => aim(e.clientX, e.clientY)}
        onPointerLeave={() => {
          if (tilting) return;
          gravity.current.tx = 0;
          gravity.current.ty = 0;
        }}
      />
      <p className="caption marble-hint">
        {tilting ? "Tilt your phone to roll the marbles" : canTilt ? "Touch to tilt the garden" : "Move over the garden to tilt it"}
      </p>
      {canTilt && !tilting && (
        <button type="button" className="pill ghost tilt-button" onClick={askTilt}>
          Tilt with your phone
        </button>
      )}
    </div>
  );
}
