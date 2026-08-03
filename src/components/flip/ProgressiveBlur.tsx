"use client";

import type { CSSProperties } from "react";
import { blur } from "@/design/tokens";

export interface ProgressiveBlurProps {
  bandColor: string;
  edge: "top" | "bottom";
}

/**
 * Four backdrop-blur layers. Must be a sibling of `.stage`, never inside it.
 */
export function ProgressiveBlur({ bandColor, edge }: ProgressiveBlurProps) {
  const count = Math.min(blur.radii.length, blur.masks.length);

  return (
    <div
      className={`progressive-blur progressive-blur--${edge} pointer-events-none z-40`}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: edge === "top" ? 0 : "auto",
        bottom: edge === "bottom" ? 0 : "auto",
        height: "18%",
        inset: "unset",
        background: `color-mix(in oklch, ${bandColor} ${blur.tintOpacity * 100}%, transparent)`,
      }}
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => {
        const radius = blur.radii[i]!;
        const [a, b] = blur.masks[i]!;
        return (
          <div
            key={i}
            style={
              {
                "--r": `${radius}px`,
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
