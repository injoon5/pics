"use client";

/**
 * §6.3 — progressive blur.
 *
 * Not one blur. A stack of layers, each with a larger radius and a mask that
 * fades it in; that gradient is what makes the effect read as depth rather
 * than as a smeared band across the photograph.
 *
 * Four layers on iOS, not six. Each layer is a full-width backdrop sample per
 * frame, and six drops an iPhone 14 below 60fps during the flip — which is
 * precisely the moment the effect exists to serve.
 *
 * This component must never be rendered inside `.stage`: `backdrop-filter`
 * anywhere above the 3D context flattens it on iOS and the pad collapses
 * (§5.6). It lives in a sibling stacking context, always.
 */

import { useEffect, useState } from "react";
import { thumbHashToDataURL } from "thumbhash";
import { blur as tokens } from "@/design/tokens";
import { blurTint } from "@/lib/color";

export type ProgressiveBlurProps = {
  edge: "top" | "bottom";
  /** The band mean for this edge — `topBand` or `bottomBand` (§6.1). Sampling
   *  the whole-image dominant colour instead is why these overlays usually
   *  look wrong. */
  band: string;
  /** Base64 thumbhash, for the no-backdrop-filter fallback. */
  thumbhash: string;
  height: number;
};

export function ProgressiveBlur({ edge, band, thumbhash, height }: ProgressiveBlurProps) {
  const supported = useBackdropFilter();

  const style: React.CSSProperties = {
    height,
    [edge]: 0,
    zIndex: 30,
  };

  if (supported === false) {
    // Don't just drop the effect. One pre-blurred strip from the thumbhash
    // gets most of the way there, and costs a single decoded 32×32 image.
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0"
        style={{
          ...style,
          backgroundImage: `url(${dataUrl(thumbhash)})`,
          backgroundSize: "100% 100%",
          maskImage: `linear-gradient(to ${edge === "top" ? "bottom" : "top"}, black 30%, transparent)`,
          WebkitMaskImage: `linear-gradient(to ${edge === "top" ? "bottom" : "top"}, black 30%, transparent)`,
          opacity: 0.85,
        }}
      />
    );
  }

  const direction = edge === "top" ? "to bottom" : "to top";

  return (
    <div aria-hidden className="progressive-blur" style={style}>
      {/* The tint sits *under* the blur layers so the dissolve at the edge
          lands on something that matches the image behind it. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${direction}, ${blurTint(band, tokens.tintAlpha)}, transparent)`,
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          maskImage: "none",
          WebkitMaskImage: "none",
        }}
      />
      {tokens.radii.map((r, i) => (
        <div
          key={r}
          style={
            {
              "--r": `${r}px`,
              "--a": `${tokens.stops[i][0]}%`,
              "--b": `${tokens.stops[i][1]}%`,
              "--dir": direction,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Never `filter: blur()` on the full-resolution image — iOS re-rasterises the
 *  whole texture and you get a ~200ms compositor stall. Blur the placeholder. */
function dataUrl(thumbhash: string) {
  try {
    return thumbHashToDataURL(
      Uint8Array.from(atob(thumbhash), (c) => c.charCodeAt(0)),
    );
  } catch {
    return "";
  }
}

function useBackdropFilter() {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    setSupported(
      CSS.supports("backdrop-filter", "blur(1px)") ||
        CSS.supports("-webkit-backdrop-filter", "blur(1px)"),
    );
  }, []);
  return supported;
}
