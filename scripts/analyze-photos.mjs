// Build-time pass: reads real EXIF + computes average/palette color for every
// photo referenced from content/albums/**. Output is consumed at runtime by
// lib/albums.ts so no image processing ever happens in the browser.
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import exifr from "exifr";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ALBUMS_DIR = path.join(ROOT, "content", "albums");
const PHOTOS_DIR = path.join(ROOT, "public", "photos");
const OUT_DIR = path.join(ROOT, "content", "generated");
const OUT_FILE = path.join(OUT_DIR, "photo-meta.json");

const PALETTE_SIZE = 4;

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function toHex(r, g, b) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

async function analyzeColor(filePath) {
  // Downsample hard, then bucket into a tiny palette + an overall average.
  const size = 24;
  const { data, info } = await sharp(filePath)
    .rotate()
    .resize(size, size, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map();
  let rSum = 0, gSum = 0, bSum = 0;
  const pixelCount = info.width * info.height;

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    rSum += r; gSum += g; bSum += b;
    // Coarse quantization (4 bits/channel) so near-identical pixels collapse
    // into the same swatch bucket.
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
    bucket.r += r; bucket.g += g; bucket.b += b; bucket.count += 1;
    buckets.set(key, bucket);
  }

  const average = {
    r: rSum / pixelCount,
    g: gSum / pixelCount,
    b: bSum / pixelCount,
  };

  const palette = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, PALETTE_SIZE)
    .map((bucket) => toHex(bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count));

  const luminance = relativeLuminance(average.r, average.g, average.b);

  return {
    average: toHex(average.r, average.g, average.b),
    palette,
    isDark: luminance < 0.45,
  };
}

function formatShutter(exposureTime) {
  if (!exposureTime) return null;
  if (exposureTime >= 1) return `${exposureTime}s`;
  const denominator = Math.round(1 / exposureTime);
  return `1/${denominator}`;
}

async function analyzeExif(filePath) {
  const tags = await exifr.parse(filePath, {
    pick: [
      "Make", "Model", "LensModel", "FNumber", "ExposureTime",
      "ISO", "FocalLength", "FocalLengthIn35mmFormat", "DateTimeOriginal",
    ],
  });

  if (!tags) return null;

  return {
    make: tags.Make ?? null,
    model: tags.Model ?? null,
    lens: tags.LensModel ?? null,
    aperture: tags.FNumber ? Math.round(tags.FNumber * 10) / 10 : null,
    shutter: formatShutter(tags.ExposureTime),
    iso: tags.ISO ?? null,
    focalLength: tags.FocalLengthIn35mmFormat ?? tags.FocalLength ?? null,
    takenAt: tags.DateTimeOriginal ? tags.DateTimeOriginal.toISOString() : null,
  };
}

function listPhotoDocs(albumSlug) {
  const dir = path.join(ALBUMS_DIR, albumSlug);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "album.md")
    .map((f) => {
      const { data } = matter(readFileSync(path.join(dir, f), "utf8"));
      return data.src;
    });
}

async function main() {
  const albumSlugs = readdirSync(ALBUMS_DIR).filter((f) =>
    statSync(path.join(ALBUMS_DIR, f)).isDirectory()
  );

  const meta = {};
  let count = 0;

  for (const slug of albumSlugs) {
    const srcs = listPhotoDocs(slug);
    for (const src of srcs) {
      const filePath = path.join(PHOTOS_DIR, slug, src);
      const [exif, color] = await Promise.all([
        analyzeExif(filePath),
        analyzeColor(filePath),
      ]);
      meta[`${slug}/${src}`] = { exif, color };
      count += 1;
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(meta, null, 2) + "\n");
  console.log(`analyze-photos: wrote metadata for ${count} photo(s) -> ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((err) => {
  console.error("analyze-photos failed:", err);
  process.exit(1);
});
