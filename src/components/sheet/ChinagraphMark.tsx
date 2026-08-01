"use client";

/**
 * Which frame you are on, in the contact sheet.
 *
 * This was a hand-drawn blue wax circle — chinagraph pencil, the way selects
 * get marked on a real contact sheet. It was the most literal thing in the
 * build and it read as a doodle over the photograph rather than as a control.
 * The reference survives where it matters: the accent is still the wax
 * pencil's blue, and it still means *here*, and nowhere decorative.
 *
 * What replaces it is a ring in that same accent, drawn outside the thumbnail
 * so it never sits on the picture. It scales in rather than being drawn on,
 * which is one gesture instead of a performance.
 */

import { useEffect, useRef } from "react";
import { durations, cssEase } from "@/design/tokens";
import { play } from "@/design/sound";

export function ChinagraphMark({ id, drawn }: { id: string; drawn: boolean }) {
  const first = useRef(true);

  useEffect(() => {
    if (!drawn) return;
    // Not on the first paint: arriving at a sheet that already has a current
    // frame is not an event, and a sound for it would be noise.
    if (first.current) {
      first.current = false;
      return;
    }
    play("mark");
  }, [drawn, id]);

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-[3px] rounded-[13px]"
      style={{
        boxShadow: "0 0 0 2px var(--color-accent)",
        opacity: drawn ? 1 : 0,
        transform: drawn ? "scale(1)" : "scale(1.06)",
        transition: `opacity ${durations.markDraw}ms ${cssEase.out}, transform ${durations.markDraw}ms ${cssEase.out}`,
      }}
    />
  );
}
