"use client";

import { useEffect, useRef } from "react";
import {
  appearanceFromMeanL,
  themeColorFromPalette,
} from "@/lib/appearance";

export type Appearance = "light" | "dark";

/**
 * Syncs document appearance + theme-color from the settled photo palette.
 * theme-color updates once per settled photo (keyed by palette identity).
 */
export function useAppearance(
  meanL: number,
  shadowHue: number,
  themeColor?: string,
): Appearance {
  const appearance = appearanceFromMeanL(meanL);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.appearance = appearance;

    const key = `${themeColor ?? ""}:${meanL.toFixed(3)}:${shadowHue}:${appearance}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const color = themeColorFromPalette(
      meanL,
      shadowHue,
      appearance === "dark",
      themeColor,
    );
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", color);
  }, [appearance, meanL, shadowHue, themeColor]);

  return appearance;
}
