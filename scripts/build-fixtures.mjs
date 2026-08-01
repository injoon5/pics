/**
 * Builds `src/fixtures/photos.ts` from the JPEGs in `public/photos`.
 *
 * This is the client-side upload analysis of §11.3 steps 2–3, run ahead of time
 * against fixtures instead of in the studio: parse EXIF, downsample to 64×64,
 * take the band means, compute mean lightness and the shadow hue, and derive a
 * thumbhash. When Convex lands (phase 8) the same numbers get computed in the
 * browser at upload and written to the row — the shape here is the schema's
 * `palette` object verbatim, so the swap is a data-source change and nothing
 * else.
 *
 * Also emits the §7.4 srcset derivatives. §11.4's preferred path is Cloudflare
 * image transformations on the R2 custom domain, which is phase 8 work; until
 * then these are built here, which is §11.4's recorded fallback.
 *
 *   node scripts/build-fixtures.mjs
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import exifr from "exifr";
import { rgbaToThumbHash } from "thumbhash";

const PHOTOS = path.resolve("public/photos");
const DERIVED = path.resolve("public/photos/derived");
const OUT = path.resolve("src/fixtures/photos.ts");
const WIDTHS = [640, 960, 1280, 1920];

/* ── colour ──────────────────────────────────────────────────────────────
   sRGB → linear → OKLab → OKLCh. Björn Ottosson's matrices. We work in OKLCh
   throughout so the fixture values compose with the §3.1 token system and can
   be chroma-clamped at the use site without a round trip through hex. */

const toLinear = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

function rgbToOklab(r, g, b) {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLch([L, a, b]) {
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

const r3 = (n) => Math.round(n * 1000) / 1000;
const oklchString = ({ L, C, h }) => `oklch(${r3(L)} ${r3(C)} ${Math.round(h)})`;

/** Mean OKLab of a row range of a raw RGB buffer, averaged in linear-ish
 *  perceptual space rather than in sRGB — averaging gamma-encoded channels is
 *  what makes these band tints read muddy. */
function bandMean(data, width, height, fromRow, toRow) {
  let L = 0;
  let a = 0;
  let b = 0;
  let n = 0;
  for (let y = fromRow; y < toRow; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const [l, aa, bb] = rgbToOklab(data[i], data[i + 1], data[i + 2]);
      L += l;
      a += aa;
      b += bb;
      n++;
    }
  }
  return oklabToLch([L / n, a / n, b / n]);
}

/* ── EXIF formatting ─────────────────────────────────────────────────────── */

/** `1/250`, or `1"` for a full second — how a lab prints it, not `0.004`. */
function shutter(exposureTime) {
  if (!exposureTime) return undefined;
  if (exposureTime >= 1) return `${r3(exposureTime)}"`;
  return `1/${Math.round(1 / exposureTime)}`;
}

/** Apple writes "iPhone 15 Pro Max back camera 6.765mm f/1.78"; the lens name
 *  worth printing on the back of a print is the part before the focal length. */
function lensLabel(raw) {
  if (!raw) return undefined;
  return raw.replace(/\s+[\d.]+mm\s+f\/[\d.]+$/, "").trim();
}

/* ── derivatives ─────────────────────────────────────────────────────────── */

async function derivatives(file, image, meta) {
  const base = path.basename(file, path.extname(file));
  const widths = WIDTHS.filter((w) => w <= meta.width);
  if (!widths.includes(meta.width)) widths.push(meta.width);

  const out = [];
  for (const w of widths) {
    for (const [format, options] of [
      ["avif", { quality: 55, effort: 4 }],
      ["webp", { quality: 78 }],
    ]) {
      const name = `${base}@${w}.${format}`;
      await image
        .clone()
        .resize({ width: w, withoutEnlargement: true })
        [format](options)
        .toFile(path.join(DERIVED, name));
    }
    out.push(w);
  }
  return { base, widths: out.sort((a, b) => a - b) };
}

/* ── main ────────────────────────────────────────────────────────────────── */

await mkdir(DERIVED, { recursive: true });
await mkdir(path.dirname(OUT), { recursive: true });

const files = (await readdir(PHOTOS))
  .filter((f) => /\.jpe?g$/i.test(f))
  .sort();

const rows = [];

for (const file of files) {
  const full = path.join(PHOTOS, file);
  const image = sharp(full).rotate();
  const meta = await image.metadata();

  // §11.3 step 2: the analysis runs off a 64×64 downsample, not the full
  // frame. Sampling the whole-image dominant colour for an edge blur is why
  // these overlays usually look wrong — the band means are the point (§6.1).
  const { data } = await image
    .clone()
    .resize(64, 64, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const topBand = bandMean(data, 64, 64, 0, Math.round(64 * 0.15));
  const bottomBand = bandMean(data, 64, 64, Math.round(64 * 0.8), 64);
  const whole = bandMean(data, 64, 64, 0, 64);

  // thumbhash wants ≤100px on the long edge, RGBA.
  const th = await image
    .clone()
    .resize(64, 64, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const thumbhash = Buffer.from(
    rgbaToThumbHash(th.info.width, th.info.height, th.data),
  ).toString("base64");

  const exif = await exifr.parse(full, {
    tiff: true,
    exif: true,
    ifd0: true,
    gps: false, // §11.1 — GPS is stripped by default. Never read, never stored.
  });

  const { base, widths } = await derivatives(file, image, meta);

  rows.push({
    file,
    base,
    widths,
    width: meta.width,
    height: meta.height,
    thumbhash,
    palette: {
      topBand: oklchString(topBand),
      bottomBand: oklchString(bottomBand),
      shadowHue: Math.round(whole.h),
      meanL: r3(whole.L),
    },
    exif: {
      camera: exif?.Model,
      lens: lensLabel(exif?.LensModel),
      focal: exif?.FocalLength ? Math.round(exif.FocalLength) : undefined,
      aperture: exif?.FNumber ? r3(exif.FNumber) : undefined,
      shutter: shutter(exif?.ExposureTime),
      iso: exif?.ISO,
      takenAt: exif?.DateTimeOriginal
        ? new Date(exif.DateTimeOriginal).getTime()
        : undefined,
    },
  });
}

const header = `// Generated by scripts/build-fixtures.mjs — do not edit by hand.
// Real EXIF, real band means, real thumbhashes from the six JPEGs in
// public/photos. Regenerate with \`npm run fixtures\`.
//
// This is the shape phase 8 will read out of Convex (§11.1): every field here
// exists on the \`photos\` table. Captions and alt text are authored in
// src/fixtures/albums.ts, which is the part a studio would own.

export type Analysis = {
  /** Basename, sans extension — derivatives are \`<base>@<w>.<ext>\`. */
  base: string;
  file: string;
  /** Widths actually generated. Never upscaled past the intrinsic width. */
  widths: number[];
  width: number;
  height: number;
  thumbhash: string;
  palette: {
    /** Mean colour of the top 15%, in OKLCh. Tints the top blur field. */
    topBand: string;
    /** Mean colour of the bottom 20%. Tints the bottom blur field. */
    bottomBand: string;
    /** Hue only — chroma is clamped at the use site to ≤ 0.012 (§3.1). */
    shadowHue: number;
    /** Drives appearance switching at the §6.2 threshold. */
    meanL: number;
  };
  exif: {
    camera?: string;
    lens?: string;
    focal?: number;
    aperture?: number;
    shutter?: string;
    iso?: number;
    takenAt?: number;
  };
};

export const analyses = `;

await writeFile(
  OUT,
  `${header}${JSON.stringify(rows, null, 2)} as const satisfies readonly Analysis[];\n`,
  "utf8",
);

console.log(`fixtures: ${rows.length} photos → src/fixtures/photos.ts`);
for (const r of rows) {
  console.log(
    `  ${r.base.slice(0, 8)}  ${r.width}×${r.height}  meanL ${r.palette.meanL}  ` +
      `hue ${r.palette.shadowHue}  ${r.exif.camera} ${r.exif.shutter} ISO${r.exif.iso}`,
  );
}
