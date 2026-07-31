"use client";

/**
 * One album in the listing.
 *
 * This was a paper photo wallet — a flap, prints fanned at seeded angles, a
 * lab stamp in faded blue. It leaned hard on a metaphor the rest of the
 * product no longer uses, and it made the one screen that has to be *scannable*
 * into the most decorated screen in the build.
 *
 * What it is now: the album's cover photograph at a generous size, its title
 * under it, and the count and dates in one quiet line. The photograph is the
 * only thing with any colour in it, which is the point — you pick an album by
 * recognising the picture, not by reading the label.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Album } from "@/fixtures/albums";
import { sleeve as tokens, durations, cssEase } from "@/design/tokens";
import { stashPrint } from "@/lib/flight";
import { routeTransition, supportsViewTransitions } from "@/lib/viewTransition";
import { sources, fallbackSrc } from "@/lib/image";
import { takenAt } from "@/lib/format";

export function Sleeve({ album }: { album: Album }) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);
  const cover = useRef<HTMLImageElement>(null);

  const first = album.photos[0];
  const last = album.photos[album.photos.length - 1];

  /** "4 photos · July 2025 – July 2026", or a single date when the album
   *  spans one. Set at normal width — condensed numerals were reading as a
   *  filing system rather than as a caption. */
  const span = [
    `${album.photos.length} photo${album.photos.length === 1 ? "" : "s"}`,
    dateRange(first.exif.takenAt, last.exif.takenAt, album.lang),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/a/${album.slug}`}
      // Prefetch on pointerdown, so opening has nothing to wait for.
      onPointerDown={() => {
        setPressed(true);
        router.prefetch(`/a/${album.slug}`);
      }}
      onClick={(e) => {
        /* One animation per navigation. The FLIP that flies the cover into the
           pad is the *fallback* — where view transitions exist they own the
           route change, and running both meant the cover expanding to
           full-screen underneath a cross-fade of the same two pages. */
        if (!supportsViewTransitions()) {
          stashPrint(`album:${album.slug}`, cover.current);
          return;
        }
        // Modified clicks (new tab, download) keep the browser's behaviour.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        routeTransition(() => router.push(`/a/${album.slug}`), "in");
      }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="sleeve group block rounded-[16px] focus-visible:outline-none"
      aria-label={`${album.title}, ${album.photos.length} photos`}
    >
      <div
        className="relative w-full overflow-hidden rounded-[16px] bg-surface-sunk"
        style={{
          aspectRatio: "4 / 3",
          // Large surfaces get less scale than buttons — the same absolute
          // displacement reads as exaggerated on a big element.
          transform: `scale(${pressed ? tokens.pressScale : 1})`,
          transition: `transform ${durations.press}ms ${cssEase.out}`,
        }}
      >
        <picture>
          {sources(first).map((s) => (
            <source key={s.type} type={s.type} srcSet={s.srcSet} sizes="(min-width: 720px) 640px, 92vw" />
          ))}
          <img
            ref={cover}
            src={fallbackSrc(first)}
            alt=""
            className="print-cover"
            decoding="async"
            loading="lazy"
          />
        </picture>

        {/* How many are behind this one. A count, not a simulated stack. */}
        {album.photos.length > 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-[oklch(0_0_0/0.42)] px-2.5 py-1 text-[12px] tabular-nums text-white backdrop-blur-sm">
            {album.photos.length}
          </span>
        )}
      </div>

      <div className="px-1 pt-3">
        <h2
          className="album-title m-0 text-[19px] text-text-primary"
          lang={album.lang}
        >
          {album.title}
        </h2>
        <p className="m-0 mt-1 text-[14px] tabular-nums text-text-secondary">{span}</p>
      </div>
    </Link>
  );
}

function dateRange(from: number | undefined, to: number | undefined, lang: string) {
  const fmt = (ms: number) =>
    new Intl.DateTimeFormat(lang, { year: "numeric", month: "long" }).format(new Date(ms));
  if (!from) return takenAt(to, lang) ?? "";
  if (!to || fmt(from) === fmt(to)) return fmt(from);
  return `${fmt(from)} – ${fmt(to)}`;
}
