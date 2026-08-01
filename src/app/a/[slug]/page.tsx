import { notFound } from "next/navigation";
import type { Metadata, Viewport } from "next";
import { albumBySlug, publishedAlbums } from "@/fixtures/albums";
import { AlbumView } from "./AlbumView";
import { preloadFor } from "@/lib/image";
import { themeColor } from "@/lib/color";
import { appearanceFor } from "@/lib/color";

export function generateStaticParams() {
  return publishedAlbums().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const album = albumBySlug((await params).slug);
  if (!album) return {};
  return {
    title: album.title,
    description: album.subtitle ?? album.intro.slice(0, 140),
  };
}

/**
 * The album's opening appearance, so there is no white flash before
 * `useAppearance` takes over on the first settle (§6.2). It goes through
 * `generateViewport` rather than a `<meta>` in the page body: Next already
 * emits a `theme-color` from the root layout's viewport export, and two
 * hoisted metas for the same name hydrate in a different order than they
 * render, which is a mismatch React will regenerate the tree over.
 */
export async function generateViewport({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Viewport> {
  const album = albumBySlug((await params).slug);
  if (!album) return {};
  const { palette } = album.photos[0];
  return {
    themeColor: themeColor(palette.topBand, appearanceFor(palette.meanL) === "dark"),
  };
}

/**
 * §11.5 — one query per album returns everything, ordered, and the first card
 * is server-rendered so photo 1 and the intro paint before hydration.
 *
 * When Convex lands this becomes a preloaded query instead of a fixture
 * import; nothing below the fold changes.
 */
export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const album = albumBySlug((await params).slug);
  if (!album || !album.published) notFound();

  const first = album.photos[0];
  const preload = preloadFor(first);

  return (
    <>
      {/* Photo 1 is the LCP element on every album. Naming its srcset here
          means it is in flight during hydration rather than after it. */}
      <link
        rel="preload"
        as="image"
        imageSrcSet={preload.imageSrcSet}
        imageSizes={preload.imageSizes}
        fetchPriority="high"
      />
      <AlbumView album={album} />
    </>
  );
}
