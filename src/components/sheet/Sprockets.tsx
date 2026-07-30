"use client";

/**
 * The sprocket-hole strips down both gutters of the contact sheet (§8).
 *
 * One SVG, repeated as a background — not N elements. The holes are what make
 * a grid of thumbnails read as a strip of film rather than as a photo grid,
 * and they have to survive being tiled down an arbitrarily long sheet.
 *
 * Rounded rectangles, not circles: 135 format perforations are rectangular
 * with a generous corner radius, and circles read as a decorative dot column.
 */

const HOLE = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="32" viewBox="0 0 18 32">
     <rect x="3.5" y="8" width="11" height="16" rx="2.6" fill="black"/>
   </svg>`,
);

export function Sprockets({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 w-[18px]"
      style={{
        [side]: 4,
        // Punched *through* the sheet: the holes are the sunk ground showing
        // past the sheet surface, so they get a mask rather than a fill.
        backgroundColor: "var(--color-separator)",
        maskImage: `url("data:image/svg+xml,${HOLE}")`,
        WebkitMaskImage: `url("data:image/svg+xml,${HOLE}")`,
        maskSize: "18px 32px",
        WebkitMaskSize: "18px 32px",
        maskRepeat: "repeat-y",
        WebkitMaskRepeat: "repeat-y",
        opacity: 0.75,
      }}
    />
  );
}
