"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { rubberband } from "@/design/gesture";
import { gesture } from "@/design/tokens";

/**
 * Drag-to-dismiss for the contact sheet.
 * Close when average velocity `|distance|/elapsedMs > dismissVelocity` — no distance threshold.
 */
export function useSheetGestures({
  enabled,
  onDismiss,
}: {
  enabled: boolean;
  onDismiss: () => void;
}) {
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startTs = useRef(0);
  const lastY = useRef(0);
  const activePointer = useRef<number | null>(null);

  const reset = useCallback(() => {
    setOffsetY(0);
    setDragging(false);
    activePointer.current = null;
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) return;
      // Only primary button / touch; ignore multi-touch for dismiss
      if (event.button !== 0) return;
      activePointer.current = event.pointerId;
      startY.current = event.clientY;
      lastY.current = event.clientY;
      startTs.current = performance.now();
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || activePointer.current !== event.pointerId) return;
      const raw = event.clientY - startY.current;
      lastY.current = event.clientY;
      // Only pull downward; rubberband past sheetRubberbandStartPx
      if (raw <= 0) {
        setOffsetY(0);
        return;
      }
      const dim = typeof window !== "undefined" ? window.innerHeight : 800;
      const start = gesture.sheetRubberbandStartPx;
      if (raw <= start) {
        setOffsetY(raw);
        return;
      }
      const overshoot = raw - start;
      setOffsetY(start + rubberband(overshoot, dim));
    },
    [enabled],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || activePointer.current !== event.pointerId) return;
      const distance = Math.abs(lastY.current - startY.current);
      const elapsedMs = Math.max(1, performance.now() - startTs.current);
      const velocity = distance / elapsedMs;
      activePointer.current = null;
      setDragging(false);

      if (velocity > gesture.dismissVelocity) {
        onDismiss();
        setOffsetY(0);
        return;
      }
      setOffsetY(0);
    },
    [enabled, onDismiss],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (activePointer.current !== event.pointerId) return;
      reset();
    },
    [reset],
  );

  return {
    offsetY,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    reset,
  };
}
