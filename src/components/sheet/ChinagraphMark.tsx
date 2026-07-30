"use client";

/**
 * The chinagraph mark (§8).
 *
 * Photographers mark selects on contact sheets with a blue wax pencil, because
 * blue didn't reproduce on ortho film. Which is why the accent colour in this
 * product is blue, and why the accent colour and the whimsical detail are the
 * same object: the blue *is* a wax pencil.
 *
 * So this must not look like a stroked `<circle>`. It is deliberately
 * non-circular, with one visible overshoot where the pencil crosses itself,
 * and it is seeded from the photo id — the same circle every time for a given
 * frame, and the same seed the stack and the sleeve use.
 */

import { useEffect, useRef } from "react";
import { durations, sheet as tokens, cssEase } from "@/design/tokens";
import { seeded } from "@/lib/rng";
import { play } from "@/design/sound";

export function ChinagraphMark({ id, drawn }: { id: string; drawn: boolean }) {
  const ref = useRef<SVGPathElement>(null);
  const path = useRef(wobblyCircle(id)).current;

  useEffect(() => {
    const el = ref.current;
    if (!el || !drawn) return;

    const length = el.getTotalLength();
    el.style.strokeDasharray = String(length);

    // Reduced motion: the mark appears already drawn. The information — this
    // is the frame you're on — survives; the flourish doesn't (§13).
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.strokeDashoffset = "0";
      return;
    }

    el.style.transition = "none";
    el.style.strokeDashoffset = String(length);
    void el.getBoundingClientRect();
    el.style.transition = `stroke-dashoffset ${durations.markDraw}ms ${cssEase.out}`;
    el.style.strokeDashoffset = "0";
    play("mark");
  }, [drawn, id]);

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -inset-[6px] h-[calc(100%+12px)] w-[calc(100%+12px)]"
      style={{ opacity: drawn ? 1 : 0 }}
    >
      <path
        ref={ref}
        d={path}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={tokens.markStrokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * A closed loop of eight points at jittered radii, drawn as a cubic spline,
 * plus an overshoot past the start so the pencil visibly crosses its own line.
 *
 * The jitter is small — ±8% of the radius. Any more and it stops reading as a
 * hand-drawn circle and starts reading as a blob.
 */
function wobblyCircle(id: string): string {
  const rnd = seeded(id);
  const points = 8;
  const cx = 50;
  const cy = 50;
  const rx = 44;
  const ry = 44;
  const start = rnd() * Math.PI * 2;

  const at = (i: number) => {
    const a = start + (i / points) * Math.PI * 2;
    const wobble = 1 + (rnd() - 0.5) * 0.16;
    return [cx + Math.cos(a) * rx * wobble, cy + Math.sin(a) * ry * wobble] as const;
  };

  const ring = Array.from({ length: points }, (_, i) => at(i));

  // Catmull–Rom through the ring, converted to cubic béziers — a polyline
  // would read as a polygon and a single ellipse would read as a UI ring.
  let d = `M ${ring[0][0].toFixed(2)} ${ring[0][1].toFixed(2)}`;
  const total = ring.length;
  const overshootPoints = Math.max(1, Math.round(total * tokens.markOvershoot * 2));

  for (let i = 0; i < total + overshootPoints; i++) {
    const p0 = ring[(i - 1 + total) % total];
    const p1 = ring[i % total];
    const p2 = ring[(i + 1) % total];
    const p3 = ring[(i + 2) % total];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }

  return d;
}
