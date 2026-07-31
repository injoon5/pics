import Link from "next/link";
import { ArrivedOnListing } from "@/components/chrome/ArrivedOnListing";
import { Sleeve } from "@/components/sleeve/Sleeve";
import { publishedAlbums } from "@/fixtures/albums";

/**
 * The album listing.
 *
 * A single column on a phone, two from tablet width up. The photographs carry
 * it; everything else is a title, a count and a date, set at one width and one
 * weight apart from the heading. Server-rendered — it is static data and there
 * is nothing here that needs to wait for hydration.
 */
export default function AlbumListing() {
  const albums = publishedAlbums();

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-[960px] px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <ArrivedOnListing />
      <header className="mb-10 sm:mb-14">
        <h1 className="album-title m-0 text-[32px] tracking-[-0.01em] text-text-primary sm:text-[40px]">
          Prints
        </h1>
        <p className="m-0 mt-2 text-[15px] text-text-secondary">
          {albums.length} album{albums.length === 1 ? "" : "s"}
        </p>
      </header>

      {albums.length === 0 ? (
        // An empty screen is an invitation, not an apology.
        <div className="rounded-[16px] bg-surface-sunk px-6 py-20 text-center">
          <p className="m-0 text-[16px] text-text-primary">No albums yet.</p>
          <Link
            href="/studio"
            className="press mt-4 inline-block text-[15px] text-accent underline underline-offset-4"
          >
            Start one →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-y-12">
          {albums.map((album) => (
            <Sleeve key={album.slug} album={album} />
          ))}
        </div>
      )}
    </main>
  );
}
