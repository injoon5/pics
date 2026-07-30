"use client";

import NumberFlow from "@number-flow/react";
import { motion as motionTokens, type as typeTokens } from "@/design/tokens";

export interface FilmCounterProps {
  current: number;
  total: number;
}

/**
 * Film-style frame counter — current digit accent, total tertiary, wdth 82.
 */
export function FilmCounter({ current, total }: FilmCounterProps) {
  const safeCurrent = Math.max(0, Math.min(current, total));

  return (
    <div
      className="type-frame pointer-events-none fixed right-4 z-50 flex items-baseline gap-0.5 tabular-nums"
      style={{
        top: "calc(1rem + env(safe-area-inset-top, 0px))",
        fontVariationSettings: `"opsz" ${typeTokens.frame.opsz}, "wght" ${typeTokens.frame.wght}, "wdth" ${typeTokens.frame.wdth}`,
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <NumberFlow
        value={safeCurrent}
        format={{ minimumIntegerDigits: 2 }}
        className="text-accent"
        style={{
          transitionDuration: `${motionTokens.filmCounterMs}ms`,
        }}
      />
      <span className="text-text-tertiary">/</span>
      <span className="text-text-tertiary">
        {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}
