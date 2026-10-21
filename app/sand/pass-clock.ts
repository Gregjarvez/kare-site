export type Phase = "idle" | "carving" | "holding" | "passing" | "passed";

export type PassFrame = {
  front: number;
  decay: number;
  reveal: number;
  stampText: boolean;
};

const HOLD_SECONDS = 2.2;
const SETTLE_SECONDS = 3.5;
const PASSED_SECONDS = 6;

export class PassClock {
  phase: Phase = "idle";
  private time = 0;
  private at = 0;
  private carveSeconds = 2;
  private passSeconds = 24;

  constructor(private onPhase?: (phase: Phase) => void) {}

  detach() {
    this.onPhase = undefined;
  }

  begin(characters: number, passSeconds: number) {
    this.carveSeconds = Math.min(3.2, 0.9 + characters * 0.045);
    this.passSeconds = passSeconds;
    this.set("carving");
  }

  tick(dt: number): PassFrame {
    this.time += dt;
    const since = this.time - this.at;
    switch (this.phase) {
      case "carving": {
        const reveal = Math.min(1.02, since / this.carveSeconds);
        if (since >= this.carveSeconds + 0.2) this.set("holding");
        return { front: 2, decay: 0, reveal, stampText: true };
      }
      case "holding":
        if (since > HOLD_SECONDS) this.set("passing");
        return { front: 2, decay: 0, reveal: 2, stampText: false };
      case "passing":
        if (since > this.passSeconds + SETTLE_SECONDS) this.set("passed");
        return { front: 1.02 - 1.12 * Math.min(1, since / this.passSeconds), decay: 0.34, reveal: 2, stampText: false };
      case "passed":
        if (since > PASSED_SECONDS) this.set("idle");
        return { front: -1, decay: 0.26, reveal: 2, stampText: false };
      default:
        return { front: -1, decay: 0.26, reveal: 2, stampText: false };
    }
  }

  private set(phase: Phase) {
    this.phase = phase;
    this.at = this.time;
    this.onPhase?.(phase);
  }
}
