"use client";

/**
 * §7.1 — the hinge must not move.
 *
 * `100dvh` changes as Safari's URL bar collapses, so a hinge at `50dvh` shifts
 * several points mid-scroll, on every scroll. That is not a subtle defect: the
 * hinge is the one fixed line the whole metaphor hangs off, and a hinge that
 * drifts turns a physical object back into a web page.
 *
 * So the stage is laid out against a height measured once and re-measured only
 * on orientation change. The scroller still uses `100dvh`, because snapping
 * must match the *visible* area — the two are deliberately different.
 */

import { useEffect } from "react";
import { hinge } from "@/design/tokens";

export function useStableViewport(ratio = hinge.ratio) {
  useEffect(() => {
    const root = document.documentElement;

    const freeze = () => {
      const h = window.innerHeight;
      root.style.setProperty("--hinge-y", `${Math.round(h * ratio)}px`);
      root.style.setProperty("--pane-h", `${Math.round(h * (1 - ratio))}px`);
      root.style.setProperty("--stable-h", `${h}px`);

      // Book mode hinges on the vertical, so it measures against width. Width
      // does not drift the way height does on iOS, but freezing both here
      // keeps one function answerable for the pad's geometry.
      const w = window.innerWidth;
      root.style.setProperty("--hinge-x", `${Math.round(w * ratio)}px`);
      root.style.setProperty("--pane-w", `${Math.round(w * (1 - ratio))}px`);
    };

    freeze();

    // Orientation change only. Listening to `resize` would reintroduce exactly
    // the drift this exists to prevent — on iOS the URL bar collapsing *is* a
    // resize. Rotation must re-freeze without resetting scroll, which it does:
    // we only write custom properties, never touch the scroller.
    const onOrientation = () => {
      // The metrics are stale in the same tick as the event on iOS.
      requestAnimationFrame(() => requestAnimationFrame(freeze));
    };

    window.addEventListener("orientationchange", onOrientation);
    screen.orientation?.addEventListener("change", onOrientation);

    return () => {
      window.removeEventListener("orientationchange", onOrientation);
      screen.orientation?.removeEventListener("change", onOrientation);
    };
  }, [ratio]);
}
