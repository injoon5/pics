"use client";

import { useUiStore } from "@/store/ui";
import { formatExifRow } from "@/lib/format";
import type { Photo } from "@/fixtures/types";

export function IntroBack({ text }: { text: string }) {
  return <p className="type-intro">{text}</p>;
}

export function CaptionBack({ photo }: { photo: Photo }) {
  return (
    <figure className="flex flex-col gap-2">
      {photo.note ? (
        <figcaption className="type-note text-text-secondary">{photo.note}</figcaption>
      ) : null}
      <p className="type-exif">{formatExifRow(photo.exif)}</p>
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
        <p className="type-lab-stamp mt-1">
          {String(count).padStart(2, "0")} frames
        </p>
      </div>
      {photo?.note ? (
        <p className="type-note text-text-secondary">{photo.note}</p>
      ) : null}
      {photo ? <p className="type-exif">{formatExifRow(photo.exif)}</p> : null}
      {colophon ? <p className="type-lab-stamp">{colophon}</p> : null}
      <p className="type-note text-text-tertiary">That&apos;s the roll.</p>
      <label className="type-lab-stamp flex items-center gap-2 text-[0.75rem]">
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
