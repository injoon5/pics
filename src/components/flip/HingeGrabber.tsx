"use client";

import { chrome } from "@/design/tokens";

export interface HingeGrabberProps {
  onOpen: () => void;
}

/**
 * Hit area at the hinge to open the contact sheet (≥40px).
 */
export function HingeGrabber({ onOpen }: HingeGrabberProps) {
  const size = chrome.minHitArea;

  return (
    <button
      type="button"
      className="hinge pointer-events-auto fixed left-1/2 z-[60] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 focus-visible:opacity-100"
      style={{
        top: "var(--hinge-y)",
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
      aria-label="Open contact sheet"
      onClick={onOpen}
    />
  );
}
