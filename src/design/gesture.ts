import { gesture } from "./tokens";

/** Apple's exponential-decay projection (Designing Fluid Interfaces). */
export function project(velocity: number, decelerationRate = gesture.decelerationRate) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export function rubberband(overshoot: number, dimension: number, c = gesture.rubberbandConstant) {
  return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
}

export function nearestSnapPoint(value: number, points: number[]) {
  let best = points[0] ?? 0;
  let bestDist = Math.abs(value - best);
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    const d = Math.abs(value - p);
    if (d < bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Sample cubic-bezier easing into [0,1] → [0,1] lookup for CSS keyframe stops. */
export function sampleCubicBezier(
  ease: [number, number, number, number],
  stops: number,
): { t: number; v: number }[] {
  const [x1, y1, x2, y2] = ease;
  const out: { t: number; v: number }[] = [];
  for (let i = 0; i <= stops; i++) {
    const t = i / stops;
    // Solve cubic bezier for x≈t, return y. Newton on x(u).
    let u = t;
    for (let k = 0; k < 8; k++) {
      const x = cubic(u, x1, x2) - t;
      const dx = cubicDeriv(u, x1, x2);
      if (Math.abs(dx) < 1e-6) break;
      u -= x / dx;
      u = clamp(u, 0, 1);
    }
    out.push({ t, v: cubic(u, y1, y2) });
  }
  return out;
}

function cubic(t: number, a: number, b: number) {
  const mt = 1 - t;
  return 3 * mt * mt * t * a + 3 * mt * t * t * b + t * t * t;
}

function cubicDeriv(t: number, a: number, b: number) {
  const mt = 1 - t;
  return 3 * mt * mt * a + 6 * mt * t * (b - a) + 3 * t * t * (1 - b);
}
