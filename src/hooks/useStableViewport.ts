"use client";

/**
 * The pad's geometry: it must fit the window, and the hinge must not twitch.
 *
 * Those two pull in opposite directions. `100dvh` changes as Safari's URL bar
 * collapses, so a hinge at `50dvh` shifts several points mid-scroll on every
 * scroll — the hinge is the one fixed line the whole thing hangs off, and one
 * that drifts turns an object back into a web page. But freezing outright is
 * worse: resize an iPad window in Stage Manager, or drag a desktop window, and
 * the pad keeps the size it had when it loaded and no longer fits the screen.
 *
 * So the rule is narrower than "freeze": re-measure on any resize *except* the
 * one Safari's chrome causes. That one is identifiable — the width does not
 * change and the height moves by less than the chrome's own height. Everything
 * else is a real resize and the pad follows it.
 */

import { useEffect } from "react";
import { hinge } from "@/design/tokens";

/** Safari's bars are ~56pt expanded and ~44pt collapsed; a little headroom on
 *  top of that covers the toolbar too. A genuine window resize is almost never
 *  this small, and if it is, being off by a few points is invisible. */
const CHROME_HEIGHT_TOLERANCE = 132;

export function useStableViewport(ratio = hinge.ratio) {
  useEffect(() => {
    const root = document.documentElement;
    let frozenW = 0;
    let frozenH = 0;

    const freeze = () => {
      const h = window.innerHeight;
      const w = window.innerWidth;
      frozenW = w;
      frozenH = h;

      root.style.setProperty("--hinge-y", `${Math.round(h * ratio)}px`);
      root.style.setProperty("--pane-h", `${Math.round(h * (1 - ratio))}px`);
      root.style.setProperty("--stable-h", `${h}px`);

      // Book mode hinges on the vertical, so it measures against width.
      root.style.setProperty("--hinge-x", `${Math.round(w * ratio)}px`);
      root.style.setProperty("--pane-w", `${Math.round(w * (1 - ratio))}px`);
    };

    freeze();

    const maybeRefreeze = () => {
      const chromeOnly =
        window.innerWidth === frozenW &&
        Math.abs(window.innerHeight - frozenH) <= CHROME_HEIGHT_TOLERANCE;
      if (!chromeOnly) freeze();
    };

    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        maybeRefreeze();
      });
    };

    // The metrics are stale in the same tick as an orientation change on iOS,
    // and that one is always a real resize, so it re-freezes unconditionally.
    const onOrientation = () => {
      requestAnimationFrame(() => requestAnimationFrame(freeze));
    };

    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", onOrientation);
    screen.orientation?.addEventListener("change", onOrientation);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", onOrientation);
      screen.orientation?.removeEventListener("change", onOrientation);
    };
  }, [ratio]);
}
