/**
 * How EXIF is printed on the back of a card, and under the loupe glass.
 *
 * §3.2: the EXIF row is set at wdth 88 with tabular numerals. These functions
 * only decide *what* the string says; the condensed numerals are what make it
 * read as lab-print data rather than UI text, and that lives in CSS.
 */

import type { Analysis } from "@/fixtures/photos";

type Exif = Analysis["exif"];

/** `35mm · f/1.8 · 1/250 · ISO 400` — the card back (§1). */
export function exifLine(exif: Exif): string {
  return [
    exif.focal !== undefined ? `${exif.focal}mm` : null,
    exif.aperture !== undefined ? `f/${trimZero(exif.aperture)}` : null,
    exif.shutter ?? null,
    exif.iso !== undefined ? `ISO ${exif.iso}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * `35mm · f/1.8 · 1/250` — the loupe readout (§8).
 *
 * Deliberately shorter than the card line: the scaffolding (`mm`, `f/`, `1/`)
 * is shared between almost every pair of photos, so torph morphs only the
 * values that actually changed and the line reads as an instrument updating.
 * Adding ISO would work too, but three values is as much as fits legibly
 * under 132px of glass.
 */
export function loupeReadout(exif: Exif): string {
  return [
    exif.focal !== undefined ? `${exif.focal}mm` : null,
    exif.aperture !== undefined ? `f/${trimZero(exif.aperture)}` : null,
    exif.shutter ?? null,
  ]
    .filter(Boolean)
    .join(" · ");
}

const trimZero = (n: number) => String(Math.round(n * 10) / 10);

/** `07/36` — the film counter (§5.3). Always two digits, so it doesn't jump. */
export const frameNumber = (i: number) => String(i + 1).padStart(2, "0");

export function takenAt(ms: number | undefined, lang: string): string | null {
  if (!ms) return null;
  return new Intl.DateTimeFormat(lang, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(ms));
}

/** `2026.07` — the lab stamp block (§9). Terse on purpose. */
export function stampDate(ms: number | undefined): string | null {
  if (!ms) return null;
  const d = new Date(ms);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}
