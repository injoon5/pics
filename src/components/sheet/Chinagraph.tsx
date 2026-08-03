"use client";

import { useId, useMemo } from "react";
import { hash, mulberry32 } from "@/design/seed";
import { motion as motionTokens } from "@/design/tokens";

/** Seeded irregular chinagraph wax mark for the current contact-sheet frame. */
export function Chinagraph({ photoId }: { photoId: string }) {
  const reactId = useId();
  const path = useMemo(() => buildIrregularCircle(photoId), [photoId]);
  const length = 240;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-accent"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={length}
        style={{
          strokeDasharray: length,
          strokeDashoffset: length,
          animation: `chinagraph-draw ${motionTokens.chinagraphMs}ms var(--ease-out) forwards`,
        }}
      />
      <style>{`
        @keyframes chinagraph-draw {
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          path { animation: none !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>
      {/* unique key per mark so remounts re-run dash animation */}
      <desc>{reactId}</desc>
    </svg>
  );
}

/** Non-circular closed path with slight overshoot, seeded per photo id. */
function buildIrregularCircle(photoId: string): string {
  const rand = mulberry32(hash(`chinagraph:${photoId}`));
  const cx = 50;
  const cy = 50;
  const baseR = 42;
  const points = 10;
  const coords: { x: number; y: number }[] = [];

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    // Irregular radius + slight overshoot past a true circle
    const wobble = 0.86 + rand() * 0.28;
    const overshoot = 1 + (rand() - 0.35) * 0.12;
    const r = baseR * wobble * overshoot;
    coords.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }

  // Smooth-ish closed cubic path through seeded points
  let d = `M ${coords[0]!.x.toFixed(2)} ${coords[0]!.y.toFixed(2)}`;
  for (let i = 0; i < points; i++) {
    const p0 = coords[i]!;
    const p1 = coords[(i + 1) % points]!;
    const p2 = coords[(i + 2) % points]!;
    const prev = coords[(i - 1 + points) % points]!;

    const c1x = p0.x + (p1.x - prev.x) / 6;
    const c1y = p0.y + (p1.y - prev.y) / 6;
    const c2x = p1.x - (p2.x - p0.x) / 6;
    const c2y = p1.y - (p2.y - p0.y) / 6;

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }
  return `${d} Z`;
}
