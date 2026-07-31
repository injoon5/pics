import { notFound } from "next/navigation";
import { getAlbum, getAlbums } from "@/lib/albums";
import { AlbumExperience } from "@/components/stack/AlbumExperience";
import { DesktopAlbumView } from "@/components/desktop/DesktopAlbumView";

export function generateStaticParams() {
  return getAlbums().map((album) => ({ slug: album.slug }));
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = getAlbum(slug);
  if (!album) notFound();

  const albums = getAlbums();
  const currentIndex = albums.findIndex((a) => a.slug === slug);
  const nextAlbum =
    albums.length > 1
      ? albums[(currentIndex + 1) % albums.length]
      : null;

  return (
    <main>
      <div className="lg:hidden">
        <AlbumExperience album={album} nextAlbum={nextAlbum} />
      </div>
      <div className="hidden lg:block">
        <DesktopAlbumView album={album} nextAlbum={nextAlbum} />
      </div>
    </main>
  );
}
