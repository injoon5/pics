"use client";

import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { TextMorph } from "torph/react";
import { SoundToggle } from "@/components/chrome/SoundToggle";
import type { Album } from "@/lib/types";

function label(index: number, album: Album) {
  if (index === 0) return "intro";
  if (index >= album.photos.length) return "fin.";
  const photo = album.photos[index];
  return photo ? photo.slug.replaceAll("-", " ") : album.title;
}

export function TopScrim({
  album,
  activeIndex,
  total,
  color,
}: {
  album: Album;
  activeIndex: number;
  total: number;
  color: string;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 backdrop-blur-xl transition-[background] duration-700 ease-out [mask-image:linear-gradient(to_bottom,black,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black,transparent)]"
        style={{
          background: `linear-gradient(to bottom, color-mix(in oklab, ${color} 30%, transparent), transparent)`,
        }}
      />
      <div
        className="relative flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        <Link
          href="/albums"
          aria-label="Back to albums"
          className="active:scale-[0.96] flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-neutral-900 backdrop-blur-md transition-transform duration-150 dark:bg-black/40 dark:text-neutral-100"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-2 text-sm text-neutral-900 backdrop-blur-md dark:bg-black/40 dark:text-neutral-100">
          <TextMorph className="max-w-[34vw] truncate" as="span">
            {label(activeIndex, album)}
          </TextMorph>
          <span className="tabular-nums text-neutral-400 dark:text-neutral-500">
            <NumberFlow value={Math.min(activeIndex + 1, total)} />/{total}
          </span>
        </div>

        <SoundToggle />
      </div>
    </div>
  );
}
