"use client";

import { chrome, motion as motionTokens } from "@/design/tokens";
import { formatExifRow } from "@/lib/format";
import type { Photo } from "@/fixtures/types";

export interface BottomRailProps {
  photo: Photo | null;
  collapsed: boolean;
}

/**
 * EXIF + note for the current print. Collapsed Safari chrome reveals more note + location.
 */
export function BottomRail({ photo, collapsed }: BottomRailProps) {
  if (!photo) {
    return <div className="bottom-rail" aria-hidden />;
  }

  const exif = formatExifRow(photo.exif);
  const showExtra = collapsed;

  return (
    <div className="bottom-rail px-4 pb-3 pt-2">
      <div
        className="mx-auto max-w-lg transition-[opacity,transform] ease-out"
        style={{
          transitionDuration: `${chrome.railDurationMs}ms`,
          transform: showExtra ? "translateY(0)" : undefined,
        }}
      >
        {exif ? (
          <p className="exif type-exif mb-1 text-text-tertiary">{exif}</p>
        ) : null}
        {photo.note ? (
          <p
            className="caption type-note text-text-secondary"
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: showExtra ? 3 : 1,
              overflow: "hidden",
              transitionDuration: `${motionTokens.chromeRailMs}ms`,
            }}
          >
            {photo.note}
          </p>
        ) : null}
        {showExtra && photo.showLocation && photo.location?.label ? (
          <p className="mt-1 type-exif text-text-tertiary">{photo.location.label}</p>
        ) : null}
      </div>
    </div>
  );
}
