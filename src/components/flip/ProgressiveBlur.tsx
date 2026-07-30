"use client";

import type { CSSProperties } from "react";
import { blur } from "@/design/tokens";

export interface ProgressiveBlurProps {
  bandColor: string;
  edge: "top" | "bottom";
  /**
   * Pre-analyzed strength 0–1. Scales height + tint so edges that already
   * match the surface stay quiet, and high-contrast bands get more blur.
   */
  strength?: number;
}

/**
 * Variable progressive blur. Sibling of `.stage`, never inside it.
 * Bottom edge lifts with `--chrome-inset` so iOS Safari’s floating tab bar
 * doesn’t leave a raw gap under the print.
 */
export function ProgressiveBlur({
  bandColor,
  edge,
  strength = 0.7,
}: ProgressiveBlurProps) {
  const count = Math.min(blur.radii.length, blur.masks.length);
  const s = Math.min(1, Math.max(0.2, strength));
  const heightPct = blur.minHeightPct + s * (blur.maxHeightPct - blur.minHeightPct);
  const tint = blur.tintOpacity * (0.55 + s * 0.45);

  return (
    <div
      className={`progressive-blur progressive-blur--${edge} pointer-events-none z-40`}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: edge === "top" ? 0 : "auto",
        bottom:
          edge === "bottom"
            ? "calc(env(safe-area-inset-bottom, 0px) + var(--chrome-inset, 0px))"
            : "auto",
        height: `${heightPct.toFixed(1)}%`,
        background: `color-mix(in oklch, ${bandColor} ${tint * 100}%, transparent)`,
        transition:
          edge === "bottom"
            ? `bottom ${blur.chromeFollowMs}ms var(--ease-out), height 280ms var(--ease-out), background 280ms var(--ease-out)`
            : "height 280ms var(--ease-out), background 280ms var(--ease-out)",
      }}
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => {
        const radius = blur.radii[i]! * (0.7 + s * 0.5);
        const [a, b] = blur.masks[i]!;
        return (
          <div
            key={i}
            style={
              {
                "--r": `${radius.toFixed(2)}px`,
                "--a": `${a}%`,
                "--b": `${b}%`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
