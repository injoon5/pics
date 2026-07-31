import Link from "next/link";
import type { Album } from "@/lib/types";

export function IntroBack({ album }: { album: Album }) {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-5">
      <div className="min-h-0 flex-1 overflow-hidden">
        <h1 className="font-display text-xl font-medium leading-tight text-neutral-900 dark:text-neutral-100">
          {album.title}
        </h1>
        {album.subtitle ? (
          <p className="mt-1 text-sm text-neutral-500">{album.subtitle}</p>
        ) : null}
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {album.description}
        </p>
      </div>
      <p className="shrink-0 text-sm text-neutral-400 dark:text-neutral-600">
        Scroll to turn over ↑
      </p>
    </div>
  );
}

/**
 * Front face of the closing card — the only place the reader can move on to
 * another album without reaching for the back arrow.
 */
export function OutroPanel({
  album,
  nextAlbum,
}: {
  album: Album;
  nextAlbum: Album | null;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-7 bg-neutral-900 p-6 text-center dark:bg-neutral-100 sm:p-7">
      <div>
        <p className="font-display text-lg text-neutral-100 dark:text-neutral-900">
          fin.
        </p>
        <p className="mt-2 text-sm text-neutral-400 dark:text-neutral-500">
          {album.photos.length} prints from {album.title.toLowerCase()}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        {nextAlbum ? (
          <Link
            href={`/albums/${nextAlbum.slug}`}
            className="active:scale-[0.96] flex min-h-10 items-center rounded-full bg-neutral-100 px-4 text-sm font-medium text-neutral-900 transition-transform duration-150 dark:bg-neutral-900 dark:text-neutral-100"
          >
            Next: {nextAlbum.title}
          </Link>
        ) : null}
        <Link
          href="/albums"
          className="active:scale-[0.96] flex min-h-10 items-center text-sm text-neutral-400 underline decoration-neutral-600 underline-offset-4 transition-transform duration-150 dark:text-neutral-500 dark:decoration-neutral-400"
        >
          All albums
        </Link>
      </div>
    </div>
  );
}
