/**
 * Photo-derived colour, and the two places it is allowed to appear (§3.1).
 *
 * The interface accent is fixed. What the photograph contributes is the light
 * in the room: the wash beneath the progressive blur, and the hue of the cast
 * shadow. Neither is ever a text colour, a fill, or a border.
 */

import { appearance, shadow } from "@/design/tokens";

export type Oklch = { L: number; C: number; h: number };

const OKLCH_RE = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/;

export function parseOklch(value: string): Oklch {
  const m = OKLCH_RE.exec(value);
  if (!m) throw new Error(`Not an oklch() string: ${value}`);
  return { L: Number(m[1]), C: Number(m[2]), h: Number(m[3]) };
}

export const formatOklch = ({ L, C, h }: Oklch, alpha?: number) =>
  alpha === undefined
    ? `oklch(${round(L)} ${round(C)} ${Math.round(h)})`
    : `oklch(${round(L)} ${round(C)} ${Math.round(h)} / ${round(alpha)})`;

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * The cast shadow's hue, at chroma ≤ 0.012 (§5.4).
 *
 * A pure grey shadow on warm paper is the single most common tell that a
 * "paper" UI was made in a browser — but a shadow carrying the photograph's
 * full chroma is a coloured smear. The clamp is doing real work.
 */
export function shadowTint(hue: number, alpha: number, dark: boolean): string {
  return formatOklch({ L: dark ? 0.06 : 0.16, C: shadow.tintChromaMax, h: hue }, alpha);
}

/**
 * The blur wash. Keeps the band's own lightness — the point is that the
 * dissolve at the edge sits on something matching the image behind it — but
 * pulls chroma down so it can never compete with the accent.
 */
export function blurTint(band: string, alpha: number): string {
  const c = parseOklch(band);
  return formatOklch({ ...c, C: Math.min(c.C, 0.05) }, alpha);
}

/**
 * §6.2 — the dynamic `<meta name="theme-color">`, clamped hard: chroma ≤ 0.02,
 * lightness pulled to within 0.06 of the surface. It should read as "the room
 * warmed slightly", not as a theme change.
 *
 * Returns sRGB hex, because that is all `theme-color` takes.
 */
export function themeColor(band: string, dark: boolean): string {
  const c = parseOklch(band);
  const surfaceL = dark ? 0.228 : 0.972;
  const d = appearance.themeColorLightnessDelta;
  return oklchToHex({
    L: clamp(c.L, surfaceL - d, surfaceL + d),
    C: Math.min(c.C, appearance.themeColorChromaMax),
    h: c.h,
  });
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** OKLCh → sRGB hex. Björn Ottosson's inverse matrices, gamut-clipped. */
export function oklchToHex({ L, C, h }: Oklch): string {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);

  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const lr = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const lg = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const lb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;

  return `#${[lr, lg, lb].map(channel).join("")}`;
}

function channel(v: number): string {
  const s = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  const n = Math.round(clamp(s, 0, 1) * 255);
  return n.toString(16).padStart(2, "0");
}

/** §6.2 — appearance derives from the photograph, never from a preference. */
export const appearanceFor = (meanL: number): "light" | "dark" =>
  meanL < appearance.darkThreshold ? "dark" : "light";
