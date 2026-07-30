"use client";

import { chrome } from "@/design/tokens";
import type { Photo } from "@/fixtures/types";

export interface BottomRailProps {
  photo: Photo | null;
  collapsed: boolean;
}

/**
 * Chrome inset only. Captions live on the paper (card backs) — never duplicate
 * EXIF/note here (that caused the ghosted double text in screenshots).
 * When Safari chrome collapses, reveal location if opted-in.
 */
export function BottomRail({ photo, collapsed }: BottomRailProps) {
  const showLocation =
    collapsed && Boolean(photo?.showLocation && photo.location?.label);

  return (
    <div className="bottom-rail pointer-events-none px-4 pb-3 pt-2" aria-hidden={!showLocation}>
      {showLocation ? (
        <p
          className="mx-auto max-w-lg type-exif text-text-tertiary transition-opacity ease-out"
          style={{ transitionDuration: `${chrome.railDurationMs}ms` }}
        >
          {photo!.location!.label}
        </p>
      ) : null}
    </div>
  );
}
