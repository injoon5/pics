"use client";

import { useUiStore } from "@/store/ui";
import { formatExifRow } from "@/lib/format";
import type { Photo } from "@/fixtures/types";

export function IntroBack({ text }: { text: string }) {
  return <p className="type-intro">{text}</p>;
}

export function CaptionBack({
  photo,
  expanded = false,
}: {
  photo: Photo;
  /** Safari chrome collapsed — show second note line */
  expanded?: boolean;
}) {
  return (
    <figure className="flex flex-col gap-2">
      {photo.note ? (
        <figcaption
          className="type-note text-text-secondary"
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: expanded ? 4 : 2,
            overflow: "hidden",
          }}
        >
          {photo.note}
        </figcaption>
      ) : null}
      <p className="type-exif">{formatExifRow(photo.exif)}</p>
      {expanded && photo.showLocation && photo.location?.label ? (
        <p className="type-exif text-text-tertiary">{photo.location.label}</p>
      ) : null}
    </figure>
  );
}

export function SleeveBack({
  photo,
  colophon,
  title,
  count,
}: {
  photo?: Photo;
  colophon?: string;
  title: string;
  count: number;
}) {
  const soundEnabled = useUiStore((s) => s.soundEnabled);
  const setSoundEnabled = useUiStore((s) => s.setSoundEnabled);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="type-title">{title}</p>
        <p className="type-bench-count mt-1">
          {String(count).padStart(2, "0")} frames
        </p>
      </div>
      {photo?.note ? (
        <p className="type-note text-text-secondary">{photo.note}</p>
      ) : null}
      {photo ? <p className="type-exif">{formatExifRow(photo.exif)}</p> : null}
      {colophon ? <p className="type-lab-stamp">{colophon}</p> : null}
      <p className="type-note text-text-tertiary">That&apos;s the roll.</p>
      <label className="type-bench-count flex items-center gap-2 text-[0.75rem] text-text-secondary">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(e) => setSoundEnabled(e.target.checked)}
          className="accent-[var(--color-accent-fill)]"
        />
        Sound
      </label>
    </div>
  );
}
