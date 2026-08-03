"use client";

import { stack } from "@/design/tokens";
import { seededJitter } from "@/design/seed";

export interface StackHairlinesProps {
  remaining: number;
  total: number;
  seedId: string;
}

/**
 * One DOM node; N stacked box-shadows simulate remaining unflipped sheets.
 */
export function StackHairlines({ remaining, total, seedId }: StackHairlinesProps) {
  const layers = Math.min(
    Math.max(0, remaining),
    stack.maxVisibleLayers,
    Math.max(0, total),
  );
  const jitter = seededJitter(seedId, stack.jitterTranslate, stack.jitterRotate);

  const shadows: string[] = [];
  for (let i = 1; i <= layers; i++) {
    const alpha = Math.max(
      0,
      stack.hairlineBaseAlpha - (i - 1) * stack.hairlineAlphaStep,
    );
    const y = i * stack.layerGap;
    // Spec §5.3: `0 Npx 0 -0.5px` + separator (warm grey), not wireframe black
    shadows.push(
      `0 ${y}px 0 -0.5px color-mix(in oklch, var(--color-separator) ${Math.round(alpha * 100)}%, transparent)`,
    );
  }

  // Beyond maxVisibleLayers the eye stops counting — one thicker terminal
  if (remaining > stack.maxVisibleLayers) {
    const y = (stack.maxVisibleLayers + 1) * stack.layerGap + 1;
    shadows.push(
      `0 ${y}px 0 0 color-mix(in oklch, var(--color-separator) 35%, transparent)`,
    );
  }

  if (layers === 0) return null;

  return (
    <div
      className="stack pointer-events-none absolute left-3 right-3 z-0"
      style={{
        top: "var(--hinge-y)",
        height: "calc(100% - var(--hinge-y) - 12%)",
        borderRadius: 4,
        boxShadow: shadows.join(", "),
        transform: `translate(${jitter.dx}px, ${jitter.dy}px) rotate(${jitter.dr}deg)`,
      }}
      aria-hidden
    />
  );
}
