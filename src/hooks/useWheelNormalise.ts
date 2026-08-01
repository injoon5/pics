"use client";

/**
 * §7.5 — wheel normalisation.
 *
 * Trackpads emit many small `deltaY` values at `deltaMode: 0`; mice emit few
 * large ones, or use `deltaMode: 1` (lines). Left untreated, a mouse wheel
 * here feels like a slideshow with a stutter: each notch scrolls a third of a
 * card and the snap yanks it the rest of the way.
 *
 * So: detect coarse input, and switch it to one flip per notch with the settle
 * spring. Trackpads keep the continuous scroll they deserve.
 */

import { useEffect, useRef } from "react";
import { desktop } from "@/design/tokens";

export function useWheelNormalise(
  scroller: React.RefObject<HTMLElement | null>,
  step: (direction: 1 | -1) => void,
  enabled = true,
) {
  const coarse = useRef(false);
  const samples = useRef<number[]>([]);
  const cooling = useRef(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el || !enabled) return;

    const onWheel = (e: WheelEvent) => {
      // deltaMode 1 (lines) or 2 (pages) is a mouse, unambiguously.
      if (e.deltaMode !== 0) {
        coarse.current = true;
      } else {
        // Classify on the distribution, not on a single event: a trackpad
        // flick opens with large deltas too. Coarse input is large deltas
        // that are also *quantised* — near-identical magnitudes.
        const s = samples.current;
        s.push(Math.abs(e.deltaY));
        if (s.length > desktop.wheelCoarseSamples) s.shift();
        if (s.length === desktop.wheelCoarseSamples) {
          const max = Math.max(...s);
          const min = Math.min(...s.filter((v) => v > 0));
          coarse.current = max >= desktop.wheelNotchThreshold && max / (min || 1) < 1.6;
        }
      }

      if (!coarse.current) return;

      e.preventDefault();
      if (cooling.current || e.deltaY === 0) return;

      cooling.current = true;
      step(e.deltaY > 0 ? 1 : -1);

      // One notch, one flip. The window is the settle spring's visual
      // duration — a faster repeat would queue flips the user never asked for.
      setTimeout(() => {
        cooling.current = false;
      }, 340);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scroller, step, enabled]);
}
