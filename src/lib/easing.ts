/**
 * The flip curve, sampled.
 *
 * §4.1: on the CSS scroll-timeline path the ease has to live *in the
 * keyframes* as intermediate stops, not in `animation-timing-function`. A
 * scroll timeline with a non-linear timing function applies the curve per
 * keyframe pair, which is emphatically not what you want — you get the ease
 * restarting between every pair of stops.
 *
 * So we sample `--ease-flip` into N stops and emit them. Both paths read the
 * same four control points out of `tokens.ts`, which is what makes the two
 * implementations diffable on device (phase 3).
 */

import { flip } from "@/design/tokens";

/**
 * Solves y for a given x on a cubic-bezier with control points
 * (x1,y1) and (x2,y2), anchored at (0,0) and (1,1) — the CSS definition.
 * Newton–Raphson with a bisection fallback, which is what browsers do.
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (x: number) => number {
  const A = (a: number, b: number) => 1 - 3 * b + 3 * a;
  const B = (a: number, b: number) => 3 * b - 6 * a;
  const C = (a: number) => 3 * a;

  const calc = (t: number, a: number, b: number) =>
    ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
  const slope = (t: number, a: number, b: number) =>
    3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = slope(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      const err = calc(t, x1, x2) - x;
      if (Math.abs(err) < 1e-7) return calc(t, y1, y2);
      t -= err / d;
    }

    let lo = 0;
    let hi = 1;
    t = x;
    while (hi - lo > 1e-7) {
      if (calc(t, x1, x2) > x) hi = t;
      else lo = t;
      t = (lo + hi) / 2;
    }
    return calc(t, y1, y2);
  };
}

export const easeFlip = cubicBezier(...flip.ease);

/**
 * The `@keyframes flip` rule for the scroll-timeline path.
 *
 * Rendered into a `<style>` in the root layout: it is derived from `tokens.ts`
 * on the server, once, so there is no client JS involved and no second source
 * of truth for the curve. Emitting it from a build script into a .css file
 * would work equally well, but would mean parsing TypeScript from a .mjs
 * script to read a number that already lives one import away.
 */
export function flipKeyframes(stops = flip.keyframeStops): string {
  const lines: string[] = [];
  for (let i = 0; i <= stops; i++) {
    const p = i / stops;
    const deg = flip.degrees * easeFlip(p);
    lines.push(
      `  ${round(p * 100)}% { transform: rotateX(${round(deg)}deg); }`,
    );
  }

  const linesX = lines.map((l) => l.replace("rotateX", "rotateY"));

  return [
    "@keyframes flip {",
    ...lines,
    "}",
    "@keyframes flip-x {",
    ...linesX,
    "}",
  ].join("\n");
}

const round = (n: number) => Math.round(n * 100) / 100;
