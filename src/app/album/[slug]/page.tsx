import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlbumView } from "@/components/album/AlbumView";
import { getAlbum } from "@/fixtures/photos";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const album = getAlbum(slug);
  if (!album) return { title: "Missing roll" };
  return {
    title: album.title,
    description: album.intro,
  };
}

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params;
  const album = getAlbum(slug);
  if (!album) notFound();

  return <AlbumView album={album} />;
}
