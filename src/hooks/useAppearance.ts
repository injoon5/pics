"use client";

/**
 * §6.2 — appearance and theme-color, both derived from the photograph.
 *
 * Deliberately not `next-themes`: appearance here is a property of the print
 * you are looking at, not a user preference, and a preference library would
 * fight this on every flip (§2.5).
 *
 * The crossfade is masked with a 2px blur on the outgoing layer (§3.3) so two
 * overlapping states read as one perceived event rather than as a dissolve.
 * That blur lives on a full-screen sibling of the stage, never on the stage
 * itself — a filter anywhere above `.stage` flattens the 3D context (§5.6).
 */

import { useEffect, useRef } from "react";
import { appearanceFor, oklchToHex, parseOklch, themeColor } from "@/lib/color";
import { durations, cssEase } from "@/design/tokens";

type Palette = { meanL: number; topBand: string };

export function useAppearance(palette: Palette | undefined, enabled = true) {
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (!palette || !enabled) return;

    const next = appearanceFor(palette.meanL);
    const root = document.documentElement;

    /* The status bar tint is a property of *this* photograph, so it is written
       on every settle. It must not sit behind the appearance guard below: that
       guard compares the light/dark classification, and two consecutive photos
       on the same side of the threshold would then share a tint — which is the
       common case, not the edge case. `midtown-february` is entirely dark, so
       its whole album would have carried frame 1's colour.

       Called once per settled index by the caller, never during scroll:
       updating this mid-scroll repaints the browser's own chrome, which is
       both expensive and visibly flickery on iOS. */
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", themeColor(palette.topBand, next === "dark"));

    // Everything below is the appearance *flip*, which is a much rarer event
    // and the only thing worth crossfading.
    if (previous.current === next) return;

    const first = previous.current === null;
    previous.current = next;
    root.dataset.appearance = next;

    if (first) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // A short veil over the swap. `.appearance-veil` is a sibling of the
    // stage; it carries the blur, so nothing above the stage ever does.
    const veil = document.getElementById("appearance-veil");
    if (!(veil instanceof HTMLElement)) return;

    veil.style.transition = "none";
    veil.style.opacity = "1";
    void veil.offsetHeight;
    veil.style.transition = `opacity ${durations.appearanceCrossfade}ms ${cssEase.out}`;
    veil.style.opacity = "0";
  }, [palette, enabled]);

  /* Hand the appearance back when the album unmounts.
     `<html data-appearance="light">` is server-rendered, so it is only correct
     on a full load; an App Router navigation back to the listing would
     otherwise keep whatever the last photograph decided. The listing has no
     photograph driving it, so a dark listing is a leftover from a page you
     have already left. */
  useEffect(() => {
    if (!enabled) return;
    return () => {
      previous.current = null;
      document.documentElement.dataset.appearance = "light";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", oklchToHex(parseOklch(PAPER_50)));
    };
  }, [enabled]);
}

/** `--color-paper-50`, the listing's own ground. Kept as the OKLCh string the
 *  token is written in rather than a hex literal, so it cannot drift. */
const PAPER_50 = "oklch(0.972 0.004 86)";
