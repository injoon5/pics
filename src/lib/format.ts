import type { PhotoExif } from "@/fixtures/types";

export function formatExifRow(exif: PhotoExif): string {
  const parts: string[] = [];
  if (exif.focal != null) parts.push(`${exif.focal}mm`);
  if (exif.aperture != null) parts.push(`f/${trimNum(exif.aperture)}`);
  if (exif.shutter) parts.push(exif.shutter.startsWith("1/") ? exif.shutter : `${exif.shutter}s`);
  if (exif.iso != null) parts.push(`ISO ${exif.iso}`);
  return parts.join(" · ");
}

export function formatLoupeReadout(exif: PhotoExif): string {
  const focal = exif.focal != null ? `${exif.focal}mm` : "—";
  const aperture = exif.aperture != null ? `f/${trimNum(exif.aperture)}` : "—";
  const shutter = exif.shutter
    ? exif.shutter.startsWith("1/")
      ? exif.shutter
      : `${exif.shutter}s`
    : "—";
  return `${focal} · ${aperture} · ${shutter}`;
}

export function formatFrame(n: number, total: number) {
  return `${String(n).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
}

function trimNum(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

export function frameLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}
