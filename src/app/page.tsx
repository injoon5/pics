import Link from "next/link";
import { Sleeve } from "@/components/sleeve/Sleeve";
import { publishedAlbums } from "@/fixtures/albums";

/**
 * §9 — the sleeve drawer.
 *
 * Server-rendered: the listing is static data and there is nothing here that
 * needs to wait for hydration.
 */
export default function AlbumListing() {
  const albums = publishedAlbums();

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[560px] bg-surface-sunk px-6 pb-24 pt-16">
      <header className="mb-12">
        <h1 className="album-title m-0 text-[28px] text-text-primary">
          Prints
        </h1>
      </header>

      {albums.length === 0 ? (
        // §9 — an empty screen is an invitation, not an apology. An empty
        // sleeve, and a way to start filling it.
        <div className="rounded-[6px] border border-dashed border-separator px-6 py-16 text-center">
          <p className="caption m-0 text-[15px]">No albums yet.</p>
          <Link
            href="/studio"
            className="press mt-3 inline-block text-[15px] text-accent underline underline-offset-4"
          >
            Start one →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          {albums.map((album) => (
            <Sleeve key={album.slug} album={album} />
          ))}
        </div>
      )}
    </main>
  );
}
