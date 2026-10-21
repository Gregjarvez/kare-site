import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

import { TrayEngine, type Phase } from "~/sand/tray-engine";
import type { Look } from "~/sand/looks";

export type SandTrayHandle = {
  inscribe: (text: string, passSeconds?: number) => void;
};

type Props = {
  look: Look;
  night?: boolean;
  initialText?: string;
  passSeconds?: number;
  followPointer?: boolean;
  fallback: string;
  label: string;
  className?: string;
  onPhase?: (phase: Phase) => void;
  ref?: Ref<SandTrayHandle>;
};

export function SandTray({ look, night = false, initialText, passSeconds, followPointer, fallback, label, className, onPhase, ref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TrayEngine | null>(null);
  const onPhaseRef = useRef(onPhase);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  onPhaseRef.current = onPhase;

  useImperativeHandle(ref, () => ({
    inscribe: (text, seconds) => void engineRef.current?.inscribe(text, seconds),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: TrayEngine;
    try {
      engine = new TrayEngine(canvas, {
        look,
        night,
        onPhase: (p) => onPhaseRef.current?.(p),
        onReady: () => setReady(true),
      });
    } catch {
      setFailed(true);
      return;
    }
    engineRef.current = engine;
    engine.resize();
    if (initialText) void engine.inscribe(initialText, passSeconds);

    const resizeObserver = new ResizeObserver(() => engine.resize());
    resizeObserver.observe(canvas);

    let visible = false;
    const sync = () => (visible && !document.hidden ? engine.start() : engine.stop());
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", sync);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMove = (e: PointerEvent) => {
      if (!followPointer || reduce.matches || e.pointerType !== "mouse") return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      engine.setTilt(x, y);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onMove);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setLook(look);
  }, [look]);

  useEffect(() => {
    engineRef.current?.setNight(night);
  }, [night]);

  const drawing = useRef(false);

  return (
    <div className={`sand-tray ${className ?? ""}`} data-state={failed ? "failed" : ready ? "ready" : "loading"}>
      {failed && <img className="sand-tray-fallback" src={fallback} alt={label} />}
      {!failed && (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
          onPointerDown={(e) => {
            const engine = engineRef.current;
            if (!engine || !engine.pointerDown(e.clientX, e.clientY)) return;
            drawing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const engine = engineRef.current;
            if (!engine) return;
            if (drawing.current) engine.pointerMove(e.clientX, e.clientY);
            e.currentTarget.style.cursor = engine.hitsSand(e.clientX, e.clientY) ? "crosshair" : "";
          }}
          onPointerUp={() => {
            drawing.current = false;
            engineRef.current?.pointerUp();
          }}
          onPointerCancel={() => {
            drawing.current = false;
            engineRef.current?.pointerUp();
          }}
        />
      )}
    </div>
  );
}
