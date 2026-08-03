import { appearance } from "@/design/tokens";

/** Clamp photo mean colour into a near-surface theme-color. */
export function themeColorFromPalette(meanL: number, shadowHue: number, isDark: boolean): string {
  const surfaceL = isDark ? 0.228 : 0.972;
  const L = clamp(
    meanL,
    surfaceL - appearance.themeColorLightnessSlack,
    surfaceL + appearance.themeColorLightnessSlack,
  );
  const C = Math.min(appearance.themeColorMaxChroma, 0.02);
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${shadowHue})`;
}

export function appearanceFromMeanL(meanL: number): "light" | "dark" {
  return meanL < appearance.darkThreshold ? "dark" : "light";
}

export function shadowTint(hue: number, alpha = 0.35): string {
  return `oklch(0.25 ${Math.min(0.012, 0.012)} ${hue} / ${alpha})`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
