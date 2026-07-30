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
import { project, rubberband, VelocityTracker } from "@/lib/gesture";

export function useHingeDrag(onOpen: () => void) {
  const state = useRef({
    id: -1,
    startY: 0,
    committed: false,
    opened: false,
    tracker: new VelocityTracker(),
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
    state.current.id = e.pointerId;
    state.current.startY = e.clientY;
    state.current.committed = false;
    state.current.opened = false;
    state.current.tracker.reset();
    state.current.tracker.add(e.clientY);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = state.current;
      if (s.id !== e.pointerId || s.opened) return;

      const dy = e.clientY - s.startY;
      s.tracker.add(e.clientY);
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

      /* §3.4 — snap to where the gesture was *going*, not where it stopped.
         The pad itself never needs this: `scroll-snap-stop: always` makes the
         browser the snapper there, and it does its own fling projection. This
         is the one place the app decides a threshold itself, so this is where
         Apple's projection belongs — a short, fast flick down opens the sheet
         even though the finger never travelled the full 88px. */
      if (!s.opened && s.committed) {
        const dy = e.clientY - s.startY;
        if (dy > 0 && dy + project(s.tracker.velocity) > gesture.sheetOpenThreshold) {
          s.opened = true;
          reset(e.currentTarget);
          onOpen();
          return;
        }
      }

      if (!s.opened) reset(e.currentTarget);
      // Committed drags are not taps: swallow the click so a failed pull
      // doesn't open the thing it just refused to open.
      if (s.committed) e.preventDefault();
    },
    [onOpen, reset],
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
