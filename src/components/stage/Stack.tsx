"use client";

/**
 * §5.3 — the unflipped pile, as one DOM node with N box-shadows.
 *
 * Not N nodes. The pile is the single largest opportunity in this build to
 * quietly blow the node budget, and every layer would otherwise be a candidate
 * for compositing during the flip.
 *
 * Hairlines are `--color-separator` — warm grey. Pure black hairlines on a
 * stack of paper read as a wireframe, which is the failure mode this whole
 * design is arguing against.
 */

import { memo } from "react";
import { stack as tokens } from "@/design/tokens";

export type StackProps = {
  /** Cards still below the hinge, including the one about to flip. */
  remaining: number;
  total: number;
  /** "down" for the unflipped pile below the hinge; "up" mirrors it above. */
  direction?: "down" | "up";
  axis?: "x" | "y";
  className?: string;
  style?: React.CSSProperties;
};

function StackImpl({
  remaining,
  total,
  direction = "down",
  axis = "y",
  className,
  style,
}: StackProps) {
  const visible = Math.min(Math.max(remaining - 1, 0), tokens.maxLayers);
  const sign = direction === "down" ? 1 : -1;

  const layers = Array.from({ length: visible }, (_, k) => {
    const offset = (k + 1) * tokens.layerGap * sign;
    const alpha = Math.max(0, tokens.hairlineAlpha - k * tokens.hairlineAlphaStep);
    return axis === "y"
      ? `0 ${offset}px 0 -0.5px oklch(0.822 0.007 86 / ${alpha.toFixed(3)})`
      : `${offset}px 0 0 -0.5px oklch(0.822 0.007 86 / ${alpha.toFixed(3)})`;
  });

  // Beyond seven the eye stops counting, so the rest of the album becomes one
  // thicker terminal line rather than more hairlines nobody can resolve.
  if (remaining - 1 > tokens.maxLayers) {
    const offset = (tokens.maxLayers + 2) * tokens.layerGap * sign;
    layers.push(
      axis === "y"
        ? `0 ${offset}px 0 -0.5px var(--color-separator)`
        : `${offset}px 0 0 -0.5px var(--color-separator)`,
    );
  }

  return (
    <div
      aria-hidden
      className={className}
      style={{
        ...style,
        boxShadow: layers.join(", "),
        // You can feel how much album is left: the hinge line deepens with the
        // proportion still to come (§5.3).
        borderRadius: "var(--radius-card)",
        opacity: total > 0 ? 1 : 0,
      }}
    />
  );
}

export const Stack = memo(StackImpl);
