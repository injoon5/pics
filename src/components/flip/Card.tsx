"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useMemo, type CSSProperties, type ReactNode } from "react";
import { clamp, sampleCubicBezier } from "@/design/gesture";
import {
  card as cardTokens,
  flip,
  shadow,
  sheen,
} from "@/design/tokens";
import { frameLabel } from "@/lib/format";
import { shadowTint } from "@/lib/appearance";
import type { Photo } from "@/fixtures/types";
import type { MediaAxis } from "./useMediaAxis";

export interface CardProps {
  photo: Photo | null;
  backContent: ReactNode;
  index: number;
  /** Global scroll progress 0..photos.length */
  g: MotionValue<number>;
  axis: MediaAxis;
  useCssTimeline: boolean;
  reducedMotion: boolean;
  zBase?: number;
}

const easeSamples = sampleCubicBezier(flip.ease, flip.keyframeStops);

function easeFlip(t: number): number {
  const u = clamp(t, 0, 1);
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const last = easeSamples.length - 1;
  const scaled = u * last;
  const i = Math.min(last - 1, Math.floor(scaled));
  const a = easeSamples[i]!;
  const b = easeSamples[i + 1]!;
  const frac = scaled - i;
  return a.v + (b.v - a.v) * frac;
}

function contactAlpha(u: number): number {
  if (u <= 0) return 0.22;
  if (u >= shadow.contactPeakUntil) {
    const t = (u - shadow.contactPeakUntil) / (1 - shadow.contactPeakUntil);
    return 0.22 * (1 - clamp(t, 0, 1));
  }
  return 0.22;
}

function castAlpha(u: number): number {
  const peak = shadow.castPeakAt;
  if (u <= 0 || u >= 1) return 0;
  if (u <= peak) return (u / peak) * 0.35;
  return ((1 - u) / (1 - peak)) * 0.35;
}

function sheenOpacity(rotDeg: number): number {
  const a = Math.abs(rotDeg);
  if (a < sheen.peakFrom || a > sheen.peakTo) return 0;
  const mid = (sheen.peakFrom + sheen.peakTo) / 2;
  const half = (sheen.peakTo - sheen.peakFrom) / 2;
  return sheen.opacity * (1 - Math.abs(a - mid) / half);
}

export function Card({
  photo,
  backContent,
  index,
  g,
  axis,
  useCssTimeline,
  reducedMotion,
  zBase = 10,
}: CardProps) {
  const zMv = useMotionValue(zBase + index);

  const u = useTransform(g, (gv) => clamp(gv - index, 0, 1));
  const rot = useTransform(u, (uv) => -180 * easeFlip(uv));
  const opacityMv = useTransform(u, (uv) => {
    if (!reducedMotion) return 1;
    if (uv <= 0) return 1;
    if (uv >= 1) return 0;
    return 1 - uv;
  });

  const springU = useSpring(u, {
    visualDuration: flip.shadowLag.visualDuration,
    bounce: flip.shadowLag.bounce,
  });

  const hue = photo?.palette.shadowHue ?? 86;

  const boxShadow = useTransform(springU, (uv) => {
    const c = contactAlpha(uv);
    const k = castAlpha(uv);
    const contact = `0 1px 0 0 ${shadowTint(hue, c)}`;
    const castY = 8 + uv * 28;
    const castBlur = 12 + uv * 36;
    const cast = `0 ${castY}px ${castBlur}px -4px ${shadowTint(hue, k)}`;
    return `${contact}, ${cast}`;
  });

  const sheenOp = useTransform(rot, (r) => sheenOpacity(r));

  const transformX = useMotionTemplate`rotateX(${rot}deg)`;
  const transformY = useMotionTemplate`rotateY(${rot}deg)`;
  const transform = axis === "y" ? transformY : transformX;

  useMotionValueEvent(u, "change", (uv) => {
    zMv.set(uv >= 0.5 ? zBase + 100 - index : zBase + index);
  });

  const cssVars = useMemo(
    () =>
      ({
        "--i": index,
        "--thickness": `${cardTokens.thickness}px`,
        "--grain-opacity": cardTokens.grainOpacity,
      }) as CSSProperties,
    [index],
  );

  const matPad: CSSProperties = {
    paddingTop: cardTokens.matTop,
    paddingLeft: cardTokens.matSides,
    paddingRight: cardTokens.matSides,
    paddingBottom: cardTokens.matBottom,
  };

  return (
    <motion.div
      className={`card${useCssTimeline && !reducedMotion ? " card--css-flip" : ""}`}
      style={
        reducedMotion
          ? { ...cssVars, opacity: opacityMv, zIndex: zMv, boxShadow }
          : useCssTimeline
            ? { ...cssVars, zIndex: zMv, boxShadow }
            : { ...cssVars, transform, zIndex: zMv, boxShadow }
      }
    >
      {/* Back face — caption / intro / colophon */}
      <div className="face face--back">
        <div className="relative flex h-full flex-col justify-end p-5 pb-8">
          {backContent}
        </div>
        <div className="paper-grain" aria-hidden />
      </div>

      {/* Front face — print (or empty sleeve) */}
      <div className="face face--front">
        {photo ? (
          <div className="relative flex h-full flex-col bg-surface-recto" style={matPad}>
            <motion.div
              layoutId={`print-${photo.id}`}
              className="relative min-h-0 flex-1 overflow-hidden"
              style={{ borderRadius: cardTokens.imageRadius }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className="mat-image"
                draggable={false}
              />
            </motion.div>
            <div className="mt-2 flex justify-end">
              <span className="type-frame text-text-tertiary">
                {frameLabel(index)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-recto p-6">
            <p className="type-lab-stamp text-center">—</p>
          </div>
        )}
        <div className="paper-grain" aria-hidden />
        <motion.div className="sheen" style={{ opacity: sheenOp }} aria-hidden />
      </div>

      <div className="rim" aria-hidden />
    </motion.div>
  );
}

/** Static top-half print for the settled (already flipped) photo. */
export interface TopPrintProps {
  photo: Photo;
  visible: boolean;
}

export function TopPrint({ photo, visible }: TopPrintProps) {
  if (!visible) return null;

  const matPad: CSSProperties = {
    paddingTop: cardTokens.matTop,
    paddingLeft: cardTokens.matSides,
    paddingRight: cardTokens.matSides,
    paddingBottom: cardTokens.matBottom,
  };

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-[5] overflow-hidden"
      style={{
        top: 0,
        height: "var(--hinge-y)",
      }}
      aria-hidden
    >
      <div
        className="absolute inset-x-0 bottom-0 flex h-full flex-col bg-surface-recto"
        style={matPad}
      >
        <div
          className="relative min-h-0 flex-1 overflow-hidden"
          style={{ borderRadius: cardTokens.imageRadius }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt=""
            width={photo.width}
            height={photo.height}
            className="mat-image"
            draggable={false}
          />
        </div>
        <div className="paper-grain" aria-hidden />
      </div>
    </div>
  );
}
