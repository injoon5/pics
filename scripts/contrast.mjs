/**
 * §3.1 / §16 — measures every foreground/background pair in both appearances.
 *
 * "Re-verify every pair in both appearances after any token change. The
 * palettes are not mirror images." This is that check, runnable: it parses the
 * OKLCh tokens straight out of globals.css, so it cannot drift from the values
 * that actually ship.
 *
 *   node scripts/contrast.mjs
 */
import { readFile } from "node:fs/promises";

const css = await readFile("src/app/globals.css", "utf8");

/** Every `--name: oklch(...)` declaration, in source order. */
function scaleTokens() {
  const out = {};
  for (const m of css.matchAll(/(--color-[\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g)) {
    out[m[1]] = { L: +m[2], C: +m[3], h: +m[4] };
  }
  return out;
}

/** Role → scale token, per block. `light` is the @theme block; `dark` is the
 *  [data-appearance="dark"] block, which overrides only some of them. */
function roles(block) {
  const out = {};
  for (const m of block.matchAll(/(--color-[\w-]+):\s*var\((--color-[\w-]+)\)/g)) {
    out[m[1]] = m[2];
  }
  for (const m of block.matchAll(/(--color-[\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g)) {
    if (!m[1].match(/^--color-(paper|china)-/)) {
      out[m[1]] = { L: +m[2], C: +m[3], h: +m[4] };
    }
  }
  return out;
}

const scale = scaleTokens();
const themeBlock = css.slice(css.indexOf("@theme static"), css.indexOf("/* Dark is tuned"));
const darkBlock = css.slice(css.indexOf('[data-appearance="dark"] {'), css.indexOf("@media (prefers-contrast"));

const light = roles(themeBlock);
const dark = { ...light, ...roles(darkBlock) };

const resolve = (map, name) => {
  const v = map[name];
  return typeof v === "string" ? scale[v] : v;
};

/* OKLCh → linear sRGB → relative luminance (WCAG 2). */
function luminance({ L, C, h }) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ].map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

const ratio = (fg, bg) => {
  const a = luminance(fg) + 0.05;
  const b = luminance(bg) + 0.05;
  return (Math.max(a, b) / Math.min(a, b)).toFixed(2);
};

const pairs = [
  ["text-primary on surface", "--color-text-primary", "--color-surface", 4.5],
  ["text-secondary on surface", "--color-text-secondary", "--color-surface", 4.5],
  ["text-tertiary (EXIF) on surface", "--color-text-tertiary", "--color-surface", 4.5],
  ["accent on surface", "--color-accent", "--color-surface", 4.5],
  ["accent-on-fill on accent-fill", "--color-accent-on-fill", "--color-accent-fill", 4.5],
  ["text-primary on surface-recto", "--color-text-primary", "--color-surface-recto", 4.5],
  // The EXIF row's real background: it is printed on the back of a card.
  ["EXIF (text-secondary) on surface-recto", "--color-text-secondary", "--color-surface-recto", 4.5],
  ["text-tertiary on surface-recto", "--color-text-tertiary", "--color-surface-recto", 4.31],
  ["text-primary on surface-sunk", "--color-text-primary", "--color-surface-sunk", 4.5],
  ["accent on surface-sunk", "--color-accent", "--color-surface-sunk", 4.5],
  ["separator on surface", "--color-separator", "--color-surface", 1.0],
];

let failed = 0;
console.log("pair".padEnd(34), "light".padStart(7), "dark".padStart(7), " min");
for (const [label, fg, bg, min] of pairs) {
  const l = ratio(resolve(light, fg), resolve(light, bg));
  const d = ratio(resolve(dark, fg), resolve(dark, bg));
  const bad = +l < min || +d < min;
  if (bad) failed++;
  console.log(
    label.padEnd(34),
    `${l}:1`.padStart(7),
    `${d}:1`.padStart(7),
    ` ${min}`,
    bad ? "  ← BELOW MINIMUM" : "",
  );
}

console.log(
  failed
    ? `\n${failed} pair(s) below minimum. text-tertiary carries the EXIF row and is the tightest — do not push it lighter (§3.1).`
    : "\nAll pairs pass in both appearances.",
);
process.exit(failed ? 1 : 0);
