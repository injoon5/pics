"use client";

/**
 * §5.3 — the film counter.
 *
 * This is a deliberate exception to the frequency rule. The counter changes on
 * every flip, which normally means don't animate it — but a film advance
 * counter is a physical mechanism that genuinely rolls, and the whole product
 * is an argument that these are objects. 120ms, linear, no spring: short
 * enough to read as mechanism rather than decoration.
 *
 * It is behind a dial. Judge it on device; if it feels like a flourish rather
 * than a machine, cut it to instant and lose nothing important.
 *
 * NumberFlow, not torph: this string is nothing but a number, and digits that
 * roll vertically like an odometer are exactly what NumberFlow understands.
 * The two are never applied to the same string (§2.6).
 */

import NumberFlow from "@number-flow/react";
import { durations } from "@/design/tokens";
import { useDials } from "@/design/dials";

export function FilmCounter({ index, total }: { index: number; total: number }) {
  const p = useDials("Counter", {
    roll: true,
    tick: [durations.counterTick, 0, 400],
  });

  const current = Math.min(index + 1, total);

  return (
    <div
      className="film-counter hit-40 pointer-events-none relative flex items-baseline gap-[0.15em] text-[12px] tabular-nums"
      aria-label={`Frame ${current} of ${total}`}
    >
      <span className="text-accent">
        {p.roll ? (
          <NumberFlow
            value={current}
            format={{ minimumIntegerDigits: 2 }}
            transformTiming={{ duration: p.tick, easing: "linear" }}
            spinTiming={{ duration: p.tick, easing: "linear" }}
            opacityTiming={{ duration: p.tick, easing: "linear" }}
            willChange={false}
          />
        ) : (
          String(current).padStart(2, "0")
        )}
      </span>
      <span className="text-text-secondary">/{String(total).padStart(2, "0")}</span>
    </div>
  );
}
