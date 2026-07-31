import Link from "next/link";
import type { Album } from "@/lib/types";

export function IntroBack({ album }: { album: Album }) {
  return (
    <div className="flex h-full w-full flex-col justify-between p-6 sm:p-7">
      <div>
        <h1 className="font-display text-2xl font-medium leading-tight text-neutral-900 dark:text-neutral-100">
          {album.title}
        </h1>
        {album.subtitle ? (
          <p className="mt-1.5 text-sm text-neutral-500">{album.subtitle}</p>
        ) : null}
        <p className="mt-6 max-w-[32ch] text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {album.description}
        </p>
      </div>
      <p className="text-sm text-neutral-400 dark:text-neutral-600">
        Scroll to turn the first print over ↓
      </p>
    </div>
  );
}

export function OutroBack({
  album,
  nextAlbum,
}: {
  album: Album;
  nextAlbum: Album | null;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6 text-center sm:p-7">
      <p className="text-sm text-neutral-500">
        That&apos;s {album.photos.length} from {album.title.toLowerCase()}.
      </p>
      <div className="flex flex-col items-center gap-3">
        {nextAlbum ? (
          <Link
            href={`/albums/${nextAlbum.slug}`}
            className="active:scale-[0.96] rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 transition-transform duration-150 dark:bg-neutral-100 dark:text-neutral-900"
          >
            Next: {nextAlbum.title}
          </Link>
        ) : null}
        <Link
          href="/albums"
          className="active:scale-[0.96] text-sm text-neutral-500 underline decoration-neutral-300 underline-offset-2 transition-transform duration-150 hover:decoration-neutral-500 dark:decoration-neutral-700"
        >
          Back to all albums
        </Link>
      </div>
    </div>
  );
}
