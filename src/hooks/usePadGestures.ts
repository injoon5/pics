"use client";

/**
 * §8 pinch-to-open, and §3.4's rubber-banded sag at the ends of an album.
 *
 * Both hang off one transparent layer over the pad, because both need raw
 * pointers and neither may take scrolling away. `touch-action: pan-y` is what
 * makes that possible: the browser keeps the vertical scroll, and we still see
 * every pointer.
 *
 * The sag exists because `overscroll-behavior-y: none` (§7.3) deliberately
 * kills the native rubber band — which is right, an elastic *page* under a pad
 * of prints is two objects — and then nothing tells you that you have reached
 * the end of the roll. So the pile itself gives, and springs back.
 */

import { useCallback, useEffect, useRef } from "react";
import { animate, useMotionValue, useMotionValueEvent } from "motion/react";
import { gesture, springs } from "@/design/tokens";
import { rubberband, VelocityTracker } from "@/lib/gesture";
import { play } from "@/design/sound";

export function usePadGestures(onPinchOpen: () => void) {
  const sag = useMotionValue(0);
  const points = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef(0);
  const dragging = useRef(false);
  const startY = useRef(0);
  const tracker = useRef(new VelocityTracker());
  const sagging = useRef(false);

  useMotionValueEvent(sag, "change", (v) => {
    document.documentElement.style.setProperty("--sag", `${v}px`);
  });

  const settle = useCallback(() => {
    if (!sagging.current) return;
    sagging.current = false;
    // The pile drops back onto itself, so it makes the sound a pile makes.
    if (Math.abs(sag.get()) > 4) play("land", 0.6);
    animate(sag, 0, { ...springs.sag, velocity: -tracker.current.velocity });
  }, [sag]);

  const distance = () => {
    const [a, b] = [...points.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (points.current.size === 2) {
      pinchStart.current = distance();
      dragging.current = false;
    } else if (points.current.size === 1) {
      dragging.current = true;
      startY.current = e.clientY;
      tracker.current.reset();
      tracker.current.add(e.clientY);
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!points.current.has(e.pointerId)) return;
      points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Pinch wins over drag: two fingers is never a scroll.
      if (points.current.size === 2 && pinchStart.current > 0) {
        if (distance() / pinchStart.current > gesture.pinchOpenScale) {
          pinchStart.current = 0;
          points.current.clear();
          onPinchOpen();
        }
        return;
      }

      if (!dragging.current || points.current.size !== 1) return;

      const dy = e.clientY - startY.current;
      tracker.current.add(e.clientY);

      // Only at the ends, and only in the direction that has nowhere to go.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const atTop = window.scrollY <= 0 && dy > 0;
      const atEnd = window.scrollY >= max - 1 && dy < 0;

      if (!atTop && !atEnd) {
        if (sagging.current) settle();
        return;
      }
      if (Math.abs(dy) < gesture.hysteresis) return;

      sagging.current = true;
      sag.set(rubberband(dy, window.innerHeight));
    },
    [onPinchOpen, sag, settle],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      points.current.delete(e.pointerId);
      if (points.current.size < 2) pinchStart.current = 0;
      if (points.current.size === 0) {
        dragging.current = false;
        settle();
      }
    },
    [settle],
  );

  // A pointer that never reports up — a system gesture taking over, the tab
  // backgrounding — would otherwise leave the pile permanently sagged.
  useEffect(() => {
    const reset = () => {
      points.current.clear();
      pinchStart.current = 0;
      dragging.current = false;
      settle();
    };
    window.addEventListener("blur", reset);
    return () => window.removeEventListener("blur", reset);
  }, [settle]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onLostPointerCapture: onPointerUp,
  };
}
