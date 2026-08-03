/**
 * Pre-analyze fixture JPEGs → OKLCH palette bands for Flipbook.
 *
 * Usage: node scripts/analyze-palettes.mjs
 * Prints JSON keyed by filename; also writes src/fixtures/palettes.generated.json
 */

import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FIXTURES = path.join(ROOT, "public", "fixtures");
const OUT = path.join(ROOT, "src", "fixtures", "palettes.generated.json");

const BAND = 0.18; // top/bottom fraction sampled for edge tints
const TARGET_W = 96;

/** sRGB 0–1 → linear */
function lin(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** linear sRGB → OKLab */
function rgbToOklab(r, g, b) {
  const lr = lin(r);
  const lg = lin(g);
  const lb = lin(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

function oklabToOklch({ L, a, b }) {
  const C = Math.hypot(a, b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

function fmtOklch({ L, C, H }, alpha) {
  const base = `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)}`;
  return alpha == null ? `${base})` : `${base} / ${alpha})`;
}

function avgLab(samples) {
  if (samples.length === 0) return { L: 0.5, a: 0, b: 0 };
  let L = 0;
  let a = 0;
  let b = 0;
  for (const s of samples) {
    L += s.L;
    a += s.a;
    b += s.b;
  }
  const n = samples.length;
  return { L: L / n, a: a / n, b: b / n };
}

/** Soften band toward paper so blur tint doesn't fight chrome. */
function softBand(lch, towardL) {
  const L = lch.L * 0.72 + towardL * 0.28;
  const C = Math.min(lch.C * 0.85, 0.12);
  return { L, C, H: lch.H };
}

/** Near-surface theme-color for Safari chrome — hue from photo, L clamped. */
function themeColor(meanL, hue, isDark) {
  const surfaceL = isDark ? 0.228 : 0.972;
  const slack = 0.06;
  const L = Math.min(surfaceL + slack, Math.max(surfaceL - slack, meanL * 0.35 + surfaceL * 0.65));
  const C = Math.min(0.02, 0.014);
  return fmtOklch({ L, C, H: hue });
}

async function analyzeFile(filePath) {
  const { data, info } = await sharp(filePath)
    .rotate() // honor EXIF orientation
    .resize({ width: TARGET_W, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const labs = [];
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255;
    if (a < 0.5) continue;
    labs.push(
      rgbToOklab(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255),
    );
  }

  const topRows = Math.max(1, Math.floor(h * BAND));
  const botStart = h - topRows;
  const top = [];
  const bot = [];
  const dark = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lab = rgbToOklab(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
      if (y < topRows) top.push(lab);
      if (y >= botStart) bot.push(lab);
      if (lab.L < 0.45) dark.push(lab);
    }
  }

  const mean = oklabToOklch(avgLab(labs));
  const topLch = softBand(oklabToOklch(avgLab(top)), mean.L > 0.42 ? 0.97 : 0.25);
  const botLch = softBand(oklabToOklch(avgLab(bot)), mean.L > 0.42 ? 0.97 : 0.25);
  const shadowSrc = dark.length > labs.length * 0.08 ? dark : labs;
  const shadow = oklabToOklch(avgLab(shadowSrc));
  const shadowHue = Math.round(shadow.C > 0.008 ? shadow.H : mean.H);
  const isDark = mean.L < 0.42;

  // Blur strength: how much the edge band differs from mid-tone (0–1)
  const topDelta = Math.min(1, Math.abs(topLch.L - mean.L) * 2.2 + topLch.C * 4);
  const botDelta = Math.min(1, Math.abs(botLch.L - mean.L) * 2.2 + botLch.C * 4);

  return {
    topBand: fmtOklch(topLch),
    bottomBand: fmtOklch(botLch),
    shadowHue,
    meanL: Number(mean.L.toFixed(3)),
    themeColor: themeColor(mean.L, shadowHue, isDark),
    blurTop: Number((0.35 + topDelta * 0.65).toFixed(3)),
    blurBottom: Number((0.35 + botDelta * 0.65).toFixed(3)),
  };
}

async function main() {
  const files = (await readdir(FIXTURES))
    .filter((f) => /\.jpe?g$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.error("No JPEGs in", FIXTURES);
    process.exit(1);
  }

  /** @type {Record<string, object>} */
  const out = {};
  for (const file of files) {
    const palette = await analyzeFile(path.join(FIXTURES, file));
    out[file] = palette;
    console.log(file, JSON.stringify(palette));
  }

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`);
  console.log("\nwrote", path.relative(ROOT, OUT));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
