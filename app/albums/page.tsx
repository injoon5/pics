import { getAlbums } from "@/lib/albums";
import { AlbumListMobile } from "@/components/albums/AlbumListMobile";
import { AlbumHoverList } from "@/components/albums/AlbumHoverList";

export default function AlbumsPage() {
  const albums = getAlbums();

  return (
    <main className="min-h-dvh">
      <div className="lg:hidden">
        <AlbumListMobile albums={albums} />
      </div>
      <div className="hidden lg:block">
        <AlbumHoverList albums={albums} />
      </div>
    </main>
  );
}
