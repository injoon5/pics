"use client";

import { useEffect, useRef } from "react";
import {
  appearanceFromMeanL,
  themeColorFromPalette,
} from "@/lib/appearance";

export type Appearance = "light" | "dark";

/**
 * Syncs document appearance + theme-color from the settled photo palette.
 * theme-color updates once per settled index (throttled by index change).
 */
export function useAppearance(meanL: number, shadowHue: number): Appearance {
  const appearance = appearanceFromMeanL(meanL);
  const lastIndexKey = useRef<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.appearance = appearance;

    const key = `${meanL.toFixed(3)}:${shadowHue}:${appearance}`;
    if (lastIndexKey.current === key) return;
    lastIndexKey.current = key;

    const color = themeColorFromPalette(meanL, shadowHue, appearance === "dark");
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", color);
  }, [appearance, meanL, shadowHue]);

  return appearance;
}
