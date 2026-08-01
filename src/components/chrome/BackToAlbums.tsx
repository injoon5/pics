"use client";

/**
 * The way out of an album.
 *
 * There wasn't one. Once you opened an album the only route back to the
 * listing was the browser's own back button, which does not exist at all in a
 * standalone PWA — and standalone is the display mode this ships with.
 *
 * It sits above the hinge, opposite the film counter, and it navigates through
 * the same page transition the sleeve uses, run in reverse.
 */

import { useRouter } from "next/navigation";
import { finishRouteTransition, routeTransition } from "@/lib/viewTransition";
import { useEffect } from "react";

export function BackToAlbums({ axis }: { axis: "x" | "y" }) {
  const router = useRouter();

  // Whatever transition brought us here is waiting on this.
  useEffect(() => finishRouteTransition(), []);

  return (
    <button
      type="button"
      onClick={() => routeTransition(() => router.push("/"), "out")}
      aria-label="All albums"
      className="press hit-40 tappable fixed z-40 flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-text-secondary"
      style={
        axis === "y"
          ? { top: "calc(env(safe-area-inset-top) + 12px)", left: 12 }
          : { top: 24, left: 24 }
      }
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M10 3.5 5.5 8l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Albums
    </button>
  );
}
