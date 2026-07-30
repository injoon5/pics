"use client";

/**
 * §8 — dragging the hinge down to open the contact sheet.
 *
 * The grabber is a button first: a tap opens the sheet, which is what a
 * pointer user and a screen-reader user both get. The drag is layered on top
 * of that, so the gesture is an accelerator rather than the only way in.
 *
 * The resistance is the whole point of the interaction. Past 60px the hinge
 * stops tracking the finger 1:1 and starts giving less than you ask for, which
 * is how you know it is being held rather than how you find out you have hit a
 * wall. Past 88px it lets go.
 */

import { useCallback, useRef } from "react";
import { durations, gesture, cssEase } from "@/design/tokens";
import { rubberband } from "@/lib/gesture";

export function useHingeDrag(onOpen: () => void) {
  const state = useRef({
    id: -1,
    startY: 0,
    committed: false,
    opened: false,
  });

  const reset = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    el.style.transition = `transform ${durations.sheetToggle}ms ${cssEase.drawer}`;
    el.style.transform = "";
    window.setTimeout(() => {
      el.style.transition = "";
    }, durations.sheetToggle);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    // A second finger mid-drag would jump the hinge (§3.4).
    if (state.current.id !== -1) return;
    state.current = { id: e.pointerId, startY: e.clientY, committed: false, opened: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = state.current;
      if (s.id !== e.pointerId || s.opened) return;

      const dy = e.clientY - s.startY;
      if (!s.committed) {
        if (Math.abs(dy) < gesture.hysteresis) return;
        s.committed = true;
      }
      if (dy <= 0) return;

      if (dy > gesture.sheetOpenThreshold) {
        s.opened = true;
        reset(e.currentTarget);
        onOpen();
        return;
      }

      // 1:1 up to the resist point, then giving.
      const shown =
        dy <= gesture.sheetResistFrom
          ? dy
          : gesture.sheetResistFrom +
            rubberband(dy - gesture.sheetResistFrom, window.innerHeight);
      e.currentTarget.style.transform = `translate3d(0, ${shown}px, 0)`;
    },
    [onOpen, reset],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = state.current;
      if (s.id !== e.pointerId) return;
      state.current.id = -1;
      if (!s.opened) reset(e.currentTarget);
      // Committed drags are not taps: swallow the click so a failed pull
      // doesn't open the thing it just refused to open.
      if (s.committed) e.preventDefault();
    },
    [reset],
  );

  return {
    /** Spread onto the grabber. Kept free of any non-DOM key so it can be. */
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    /** True if the last gesture was a drag, so the click handler can bail. */
    wasDrag: () => state.current.committed,
  };
}
