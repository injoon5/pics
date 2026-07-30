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
import { appearanceFor, themeColor } from "@/lib/color";
import { durations, cssEase } from "@/design/tokens";

type Palette = { meanL: number; topBand: string };

export function useAppearance(palette: Palette | undefined, enabled = true) {
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (!palette || !enabled) return;

    const next = appearanceFor(palette.meanL);
    const root = document.documentElement;
    if (previous.current === next) return;

    const first = previous.current === null;
    previous.current = next;
    root.dataset.appearance = next;

    // Throttled to once per settled index by the caller — updating during
    // scroll repaints the browser's own UI, which is both expensive and
    // visibly flickery on iOS.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", themeColor(palette.topBand, next === "dark"));

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
}
