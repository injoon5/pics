import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Album, Photo, PhotoColor } from "./types";

const ROOT = process.cwd();
const ALBUMS_DIR = path.join(ROOT, "content", "albums");
const META_FILE = path.join(ROOT, "content", "generated", "photo-meta.json");

type PhotoMeta = Record<string, { exif: Photo["exif"]; color: PhotoColor }>;

const FALLBACK_COLOR: PhotoColor = {
  average: "#8a8a8a",
  palette: ["#8a8a8a", "#6f6f6f", "#a3a3a3", "#575757"],
  isDark: true,
};

function readMeta(): PhotoMeta {
  try {
    return JSON.parse(readFileSync(META_FILE, "utf8"));
  } catch {
    return {};
  }
}

function toDateString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function readAlbumSlugs(): string[] {
  return readdirSync(ALBUMS_DIR).filter((f) =>
    statSync(path.join(ALBUMS_DIR, f)).isDirectory()
  );
}

function readAlbum(slug: string, meta: PhotoMeta): Album {
  const dir = path.join(ALBUMS_DIR, slug);
  const albumDoc = matter(readFileSync(path.join(dir, "album.md"), "utf8"));

  const photoFiles = readdirSync(dir).filter(
    (f) => f.endsWith(".md") && f !== "album.md"
  );

  const photos: Photo[] = photoFiles
    .map((file) => {
      const doc = matter(readFileSync(path.join(dir, file), "utf8"));
      const src = doc.data.src as string;
      const key = `${slug}/${src}`;
      const photoMeta = meta[key];

      const photoSlug = src.replace(/\.[^.]+$/, "");

      return {
        slug: photoSlug,
        title: (doc.data.title as string) ?? photoSlug.replaceAll("-", " "),
        album: slug,
        src: `/photos/${slug}/${src}`,
        alt: (doc.data.alt as string) ?? "",
        order: (doc.data.order as number) ?? 0,
        note: doc.content.trim(),
        exif: photoMeta?.exif ?? null,
        color: photoMeta?.color ?? FALLBACK_COLOR,
      } satisfies Photo;
    })
    .sort((a, b) => a.order - b.order);

  return {
    slug,
    title: (albumDoc.data.title as string) ?? slug,
    subtitle: (albumDoc.data.subtitle as string) ?? null,
    date: toDateString(albumDoc.data.date),
    accent: (albumDoc.data.accent as string) ?? photos[0]?.color.average ?? null,
    description: albumDoc.content.trim(),
    photos,
  };
}

export function getAlbums(): Album[] {
  const meta = readMeta();
  return readAlbumSlugs()
    .map((slug) => readAlbum(slug, meta))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function getAlbum(slug: string): Album | null {
  const meta = readMeta();
  const slugs = readAlbumSlugs();
  if (!slugs.includes(slug)) return null;
  return readAlbum(slug, meta);
}
