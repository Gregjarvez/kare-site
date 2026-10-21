import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

import type { Look } from "~/sand/looks";
import type { Phase } from "~/sand/pass-clock";
import { createTray, type Tray } from "~/sand/tray";

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

export function SandTray({
  look,
  night = false,
  initialText,
  passSeconds,
  followPointer,
  fallback,
  label,
  className,
  onPhase,
  ref,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trayRef = useRef<Tray | null>(null);
  const onPhaseRef = useRef(onPhase);
  const lookRef = useRef(look);
  const nightRef = useRef(night);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [kind, setKind] = useState<Tray["kind"] | null>(null);
  const drawing = useRef(false);

  onPhaseRef.current = onPhase;
  lookRef.current = look;
  nightRef.current = night;

  useImperativeHandle(ref, () => ({
    inscribe: (text, seconds) => void trayRef.current?.inscribe(text, seconds),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let cleanup = () => {};

    const begin = setTimeout(() =>
      createTray(canvas, {
        look: lookRef.current,
        night: nightRef.current,
        onPhase: (p) => onPhaseRef.current?.(p),
        onFail: () => setState("failed"),
      })
        .then((tray) => {
          if (cancelled) {
            tray.destroy();
            return;
          }
          trayRef.current = tray;
          tray.setLook(lookRef.current);
          tray.setNight(nightRef.current);
          tray.resize();
          if (initialText) void tray.inscribe(initialText, passSeconds);
          setKind(tray.kind);
          setState("ready");

          const resizeObserver = new ResizeObserver(() => tray.resize());
          resizeObserver.observe(canvas);
          let visible = false;
          const sync = () => (visible && !document.hidden ? tray.start() : tray.stop());
          const io = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            sync();
          });
          io.observe(canvas);
          document.addEventListener("visibilitychange", sync);

          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
          const onMove = (e: PointerEvent) => {
            if (!followPointer || reduce.matches || e.pointerType !== "mouse") return;
            tray.setTilt((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
          };
          window.addEventListener("pointermove", onMove, { passive: true });

          cleanup = () => {
            resizeObserver.disconnect();
            io.disconnect();
            document.removeEventListener("visibilitychange", sync);
            window.removeEventListener("pointermove", onMove);
            tray.destroy();
            trayRef.current = null;
          };
        })
        .catch(() => {
          if (!cancelled) setState("failed");
        }),
    );

    return () => {
      cancelled = true;
      clearTimeout(begin);
      cleanup();
    };
  }, []);

  useEffect(() => {
    trayRef.current?.setLook(look);
  }, [look]);

  useEffect(() => {
    trayRef.current?.setNight(night);
  }, [night]);

  return (
    <div className={`sand-tray ${className ?? ""}`} data-state={state} data-engine={kind ?? undefined}>
      {state === "failed" && <img className="sand-tray-fallback" src={fallback} alt={label} />}
      {state !== "failed" && (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
          onPointerDown={(e) => {
            const tray = trayRef.current;
            if (!tray || !tray.pointerDown(e.clientX, e.clientY)) return;
            drawing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const tray = trayRef.current;
            if (!tray) return;
            if (drawing.current) tray.pointerMove(e.clientX, e.clientY);
            e.currentTarget.style.cursor = tray.hitsSand(e.clientX, e.clientY) ? "crosshair" : "";
          }}
          onPointerUp={() => {
            drawing.current = false;
            trayRef.current?.pointerUp();
          }}
          onPointerCancel={() => {
            drawing.current = false;
            trayRef.current?.pointerUp();
          }}
        />
      )}
    </div>
  );
}
