import type { Look } from "./looks";
import type { Phase } from "./pass-clock";

export type TrayOptions = {
  look: Look;
  night: boolean;
  onPhase?: (phase: Phase) => void;
  onFail?: () => void;
};

export interface Tray {
  readonly kind: "gpu" | "gl";
  setLook(look: Look): void;
  setNight(night: boolean): void;
  setTilt(x: number, y: number): void;
  inscribe(text: string, passSeconds?: number): Promise<void>;
  pointerDown(clientX: number, clientY: number): boolean;
  pointerMove(clientX: number, clientY: number): void;
  pointerUp(): void;
  hitsSand(clientX: number, clientY: number): boolean;
  resize(): void;
  start(): void;
  stop(): void;
  destroy(): void;
}

export async function createTray(canvas: HTMLCanvasElement, options: TrayOptions): Promise<Tray> {
  const { GpuTray } = await import("./gpu-tray");
  const gpu = await GpuTray.create(canvas, options).catch(() => null);
  if (gpu) return gpu;
  const { GlTray } = await import("./gl-tray");
  return new GlTray(canvas, options);
}

export async function loadHandFont() {
  await document.fonts.load('300 48px "Kalam"').catch(() => undefined);
}

export function tidy(text: string) {
  return text.trim().replace(/\s+/g, " ");
}
