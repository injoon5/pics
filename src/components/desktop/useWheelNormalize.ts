"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
  type WheelEvent as ReactWheelEvent,
} from "react";

export type WheelKind = "mouse" | "trackpad";

export interface NormalizedWheel {
  kind: WheelKind;
  /** −1 = previous / up, +1 = next / down */
  direction: -1 | 1;
  /** True when a coarse mouse notch should snap one flip */
  snap: boolean;
  deltaY: number;
}

const MOUSE_NOTCH = 40;

/**
 * Classify wheel input: coarse mouse notches vs continuous trackpad.
 * Mouse notches typically land near ±100/120; trackpads emit small deltas.
 */
export function classifyWheel(e: WheelEvent | ReactWheelEvent): NormalizedWheel {
  const deltaY = e.deltaY;
  const direction: -1 | 1 = deltaY > 0 ? 1 : -1;

  // Line/page mode is almost always a discrete mouse wheel
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE || e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return { kind: "mouse", direction, snap: true, deltaY };
  }

  const abs = Math.abs(deltaY);
  // Pixel mode: large discrete jumps ≈ mouse; small continuous ≈ trackpad
  const looksLikeNotch =
    abs >= MOUSE_NOTCH && (abs >= 80 || Math.abs(abs - 100) < 20 || Math.abs(abs - 120) < 20);

  if (looksLikeNotch) {
    return { kind: "mouse", direction, snap: true, deltaY };
  }

  return { kind: "trackpad", direction, snap: false, deltaY };
}

/**
 * Attach wheel handling that snaps one flip per mouse notch.
 * Trackpad deltas are passed through without snapping (caller may accumulate).
 */
export function useWheelNormalize(
  onStep: (direction: -1 | 1) => void,
  targetRef?: RefObject<HTMLElement | null>,
) {
  const lastSnapAt = useRef(0);
  const onStepRef = useRef(onStep);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  const handle = useCallback((e: WheelEvent | ReactWheelEvent) => {
    const normalized = classifyWheel(e);
    if (!normalized.snap) return;

    // Debounce rapid notch repeats from some mice
    const now = performance.now();
    if (now - lastSnapAt.current < 90) {
      e.preventDefault();
      return;
    }
    lastSnapAt.current = now;
    e.preventDefault();
    onStepRef.current(normalized.direction);
  }, []);

  useEffect(() => {
    const el = targetRef?.current ?? null;
    if (!el) return;
    const listener = (e: WheelEvent) => handle(e);
    el.addEventListener("wheel", listener, { passive: false });
    return () => el.removeEventListener("wheel", listener);
  }, [handle, targetRef]);

  return handle;
}
