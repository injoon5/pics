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

/** Peaks at u≈0, dead by contactPeakUntil (§5.4). */
function contactAlpha(u: number): number {
  if (u <= 0) return 0.22;
  if (u >= shadow.contactPeakUntil) return 0;
  return 0.22 * (1 - u / shadow.contactPeakUntil);
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
}: CardProps) {
  const zMv = useMotionValue(50 - index);

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
    const castBlur = 12 + uv * 36;
    // Cast falls opposite the flip direction (§5.4)
    const cast =
      axis === "y"
        ? `${8 + uv * 28}px 0 ${castBlur}px -4px ${shadowTint(hue, k)}`
        : `0 ${8 + uv * 28}px ${castBlur}px -4px ${shadowTint(hue, k)}`;
    return `${contact}, ${cast}`;
  });

  const sheenOp = useTransform(rot, (r) => sheenOpacity(r));

  const transformX = useMotionTemplate`rotateX(${rot}deg)`;
  const transformY = useMotionTemplate`rotateY(${rot}deg)`;
  const transform = axis === "y" ? transformY : transformX;

  // §4.4 — step at u=0.5; below hinge: 50−i (current on top), above: 50+i
  useMotionValueEvent(u, "change", (uv) => {
    zMv.set(uv < 0.5 ? 50 - index : 50 + index);
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

  // §5.6 — never put opacity on .card; animate face children only
  const faceOpacityStyle = reducedMotion ? { opacity: opacityMv } : undefined;

  return (
    <motion.div
      className={useCssTimeline ? "card card--css-flip" : "card"}
      style={
        useCssTimeline || reducedMotion
          ? { ...cssVars, zIndex: zMv, boxShadow }
          : { ...cssVars, transform, zIndex: zMv, boxShadow }
      }
    >
      {/* Back face — caption / intro / colophon */}
      <motion.div className="face face--back" style={faceOpacityStyle}>
        <div className="relative flex h-full flex-col justify-end p-5 pb-8">
          {backContent}
        </div>
        <div className="paper-grain" aria-hidden />
      </motion.div>

      {/* Front face — print (or empty sleeve) */}
      <motion.div className="face face--front" style={faceOpacityStyle}>
        {photo ? (
          <div className="relative flex h-full flex-col bg-surface-recto" style={matPad}>
            <div
              className="relative min-h-0 flex-1 overflow-hidden"
              style={{
                borderRadius: cardTokens.imageRadius,
                boxShadow:
                  "inset 0 0 0 1px oklch(0 0 0 / 0.06), 0 0 0 0.5px oklch(1 0 0 / 0.55)",
              }}
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
            </div>
            {/* Frame # lives on TopPrint (settled) — avoid ghost 03/04 desync near hinge */}
          </div>
        ) : (
          <div className="relative flex h-full flex-col justify-end bg-surface p-6 pb-8">
            <p className="type-note text-text-tertiary">That&apos;s the roll.</p>
          </div>
        )}
        <div className="paper-grain" aria-hidden />
        {!reducedMotion ? (
          <motion.div className="sheen" style={{ opacity: sheenOp }} aria-hidden />
        ) : null}
      </motion.div>

      <div className="rim" aria-hidden />
    </motion.div>
  );
}

/** Static settled print — top half (stack) or left half (book). */
export interface TopPrintProps {
  photo: Photo;
  visible: boolean;
  axis?: MediaAxis;
  frameIndex?: number;
}

export function TopPrint({
  photo,
  visible,
  axis = "x",
  frameIndex = 0,
}: TopPrintProps) {
  if (!visible) return null;

  const matPad: CSSProperties = {
    paddingTop: cardTokens.matTop,
    paddingLeft: cardTokens.matSides,
    paddingRight: cardTokens.matSides,
    paddingBottom: cardTokens.matBottom,
  };

  const isBook = axis === "y";

  return (
    <div
      className="pointer-events-none absolute z-[5] overflow-hidden"
      style={
        isBook
          ? {
              top: 0,
              left: 0,
              width: "var(--hinge-y)",
              height: "100%",
            }
          : {
              top: 0,
              left: 0,
              right: 0,
              height: "var(--hinge-y)",
            }
      }
      aria-hidden
      data-harness="top-print"
    >
      <div
        className="absolute inset-0 flex flex-col bg-surface"
        style={matPad}
      >
        <motion.div
          layoutId={`print-${photo.id}`}
          className="relative min-h-0 flex-1 overflow-hidden"
          style={{
            borderRadius: cardTokens.imageRadius,
            // Keep dark prints reading as objects — half-pixel cut edge
            boxShadow:
              "inset 0 0 0 1px oklch(0 0 0 / 0.06), 0 0 0 0.5px oklch(1 0 0 / 0.55)",
          }}
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
        </motion.div>
        <div className="mt-2 flex justify-end">
          <span className="type-frame text-text-tertiary">
            {frameLabel(frameIndex)}
          </span>
        </div>
        <div className="paper-grain" aria-hidden />
      </div>
    </div>
  );
}
