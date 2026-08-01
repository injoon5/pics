/**
 * §7.4 — srcset, AVIF then WebP, and the decode discipline.
 *
 * The derivatives are built by `scripts/build-fixtures.mjs`. §11.4's preferred
 * path is Cloudflare image transformations on the R2 custom domain
 * (`/cdn-cgi/image/width=960,format=auto/<key>`), which needs Images enabled on
 * the zone — that is phase 8. Until then these are the recorded fallback, and
 * `sources()` is the seam: point it at `/cdn-cgi/image/...` and nothing else
 * in the app changes.
 */

import type { Analysis } from "@/fixtures/photos";

const DERIVED = "/photos/derived";

export type Source = { type: string; srcSet: string };

export function sources(photo: Analysis): Source[] {
  const set = (ext: string) =>
    photo.widths.map((w) => `${DERIVED}/${photo.base}@${w}.${ext} ${w}w`).join(", ");

  return [
    { type: "image/avif", srcSet: set("avif") },
    { type: "image/webp", srcSet: set("webp") },
  ];
}

/** The original JPEG, as the `<img>` fallback. */
export const fallbackSrc = (photo: Analysis) => `/photos/${photo.file}`;

/** The largest derivative — what `<link rel="preload">` should name for the
 *  first card, so photo 1 is already in flight during hydration (§11.5). */
export function preloadFor(photo: Analysis) {
  return {
    imageSrcSet: sources(photo)[1].srcSet, // WebP: universally supported
    imageSizes: "100vw",
  };
}

/**
 * An undecoded image appearing mid-flip is the most visible jank in the app —
 * the card rotates into view and then the photo pops in a frame later. So the
 * card two ahead gets decoded off the main thread before it can enter view.
 *
 * Deliberately fire-and-forget: a decode failure (image not yet fetched,
 * element detached during a fast fling) must never reject into a handler.
 */
export function warmDecode(photo: Analysis) {
  if (typeof Image === "undefined") return;
  const img = new Image();
  img.decoding = "async";
  img.sizes = "100vw";
  img.srcset = sources(photo)[1].srcSet;
  img.src = fallbackSrc(photo);
  void img.decode().catch(() => {});
}
