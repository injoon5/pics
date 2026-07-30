"use client";

/**
 * §7.2 — Safari's floating bottom bar, and using the space it gives back.
 *
 * The bar is ~56pt expanded and ~44pt collapsed, and it floats *over* your
 * content. `env(safe-area-inset-bottom)` does not account for it — that inset
 * describes the home indicator, not the browser chrome — so the only honest
 * measurement is the gap between the layout viewport and the visual viewport.
 *
 * Then use the space. When the bar collapses you gain ~44pt: the caption
 * reveals its second line and the location line. When it expands they collapse
 * away. The caption panel breathes with the browser, which is the answer to
 * "the bottom part should do something about it".
 */

import { useEffect, useState } from "react";

export type ChromeState = {
  /** px of Safari chrome floating over the bottom of the layout viewport. */
  inset: number;
  /** True once the bar has collapsed far enough to be worth reclaiming. */
  collapsed: boolean;
};

/** Half-way between the collapsed (~44pt) and expanded (~56pt) heights, so the
 *  reveal doesn't chatter while the bar is mid-animation. */
const COLLAPSE_THRESHOLD = 50;

export function useIOSChrome(): ChromeState {
  const [state, setState] = useState<ChromeState>({ inset: 0, collapsed: false });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let frame = 0;
    let last = -1;

    const measure = () => {
      frame = 0;
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

      // Writing the custom property every frame is free; calling setState
      // every frame is not. The rail tracks through CSS; React only hears
      // about the collapsed/expanded transition.
      document.documentElement.style.setProperty("--chrome-inset", `${inset}px`);

      const collapsed = inset < COLLAPSE_THRESHOLD;
      if (collapsed !== (last === 1)) {
        last = collapsed ? 1 : 0;
        setState({ inset, collapsed });
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);

    return () => {
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return state;
}
