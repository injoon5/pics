/**
 * §3.4 — the three formulas, verbatim. Do not approximate them.
 *
 * These are the difference between a gesture that feels native and one that
 * feels like a web approximation of a gesture, and they are small enough that
 * there is no excuse for the approximation.
 */

import { gesture as g } from "@/design/tokens";

/**
 * Apple's exponential-decay projection (Designing Fluid Interfaces).
 *
 * NOT the textbook v²/(2·decel) form — that one models constant deceleration
 * and undershoots badly at the velocities a thumb actually produces.
 *
 * @param velocity px per second
 * @returns the additional distance the gesture was going to travel
 */
export function project(velocity: number, decelerationRate = g.decelerationRate) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Snap to the target nearest where the gesture was *going*, not nearest where
 * it stopped.
 */
export function nearestSnapPoint(position: number, spacing: number, count: number) {
  return Math.max(0, Math.min(count - 1, Math.round(position / spacing)));
}

export function projectedIndex(
  scrollTop: number,
  velocity: number,
  spacing: number,
  count: number,
) {
  return nearestSnapPoint(scrollTop + project(velocity), spacing, count);
}

/**
 * Rubber-banding — the stack sag at the ends of an album, and the resistance
 * when pulling the hinge past the sheet-open threshold.
 *
 * @param overshoot how far past the boundary the finger has gone
 * @param dimension the size of the thing being resisted against
 */
export function rubberband(overshoot: number, dimension: number, c = g.rubberband) {
  return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
}

/**
 * Dismiss on velocity, not distance (§3.4). A flick should be enough;
 * requiring a distance threshold is what makes web sheets feel unlike native
 * ones.
 */
export function shouldDismiss(distance: number, elapsedMs: number) {
  if (elapsedMs <= 0) return false;
  return Math.abs(distance) / elapsedMs > g.dismissVelocity;
}

export const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/**
 * Tracks pointer velocity over a short window. A single-sample delta is far
 * too noisy at 120Hz — the last frame of a flick is often near-zero because
 * the finger has already begun to lift.
 */
export class VelocityTracker {
  private samples: { t: number; v: number }[] = [];
  private windowMs: number;

  constructor(windowMs = 100) {
    this.windowMs = windowMs;
  }

  add(value: number, t = performance.now()) {
    this.samples.push({ t, v: value });
    const cutoff = t - this.windowMs;
    while (this.samples.length > 2 && this.samples[0].t < cutoff) {
      this.samples.shift();
    }
  }

  /** px per second. */
  get velocity() {
    if (this.samples.length < 2) return 0;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const dt = last.t - first.t;
    if (dt <= 0) return 0;
    return ((last.v - first.v) / dt) * 1000;
  }

  reset() {
    this.samples.length = 0;
  }
}

/**
 * ~10px hysteresis before committing to a drag direction, then track 1:1
 * (§3.4). Returns null until the gesture has declared itself.
 */
export function resolveDirection(
  dx: number,
  dy: number,
  threshold = g.hysteresis,
): "x" | "y" | null {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < threshold) return null;
  return ax > ay ? "x" : "y";
}
