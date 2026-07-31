"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import type { Album, Photo } from "@/lib/types";
import { ExifBack } from "./ExifBack";
import { IntroBack, OutroBack } from "./StackIntro";

export type CardFront =
  | { kind: "photo"; photo: Photo }
  | { kind: "outro" };

export type CardBack =
  | { kind: "intro" }
  | { kind: "exif"; photo: Photo }
  | { kind: "outro" };

export type StackTuning = {
  flipStart: number;
  flipEnd: number;
  liftPx: number;
  peekOffset: number;
  peekRotate: number;
  grainPhoto: number;
  grainPaper: number;
};

export function PhotoCard({
  front,
  back,
  album,
  nextAlbum,
  index,
  peekPaperCount,
  tuning,
  onFlip,
  sectionRef,
}: {
  front: CardFront;
  back: CardBack;
  album: Album;
  nextAlbum: Album | null;
  index: number;
  peekPaperCount: number;
  tuning: StackTuning;
  onFlip?: () => void;
  sectionRef: React.RefObject<HTMLElement | null>;
}) {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const rotateX = useTransform(
    scrollYProgress,
    [tuning.flipStart, tuning.flipEnd],
    [-180, 0],
    { clamp: true }
  );
  const prefersReducedMotion = useReducedMotion();
  const midpoint = (tuning.flipStart + tuning.flipEnd) / 2;
  const liftAmount = prefersReducedMotion ? 0 : tuning.liftPx;
  const liftY = useTransform(
    scrollYProgress,
    [tuning.flipStart, midpoint, tuning.flipEnd],
    [0, -liftAmount, 0],
    { clamp: true }
  );
  const edgeOpacity = useTransform(rotateX, [-135, -90, -45], [0, 1, 0]);
  const shadowBlur = useTransform(rotateX, [-180, -90, 0], [14, 34, 16]);
  const shadowAlpha = useTransform(rotateX, [-180, -90, 0], [0.14, 0.32, 0.16]);
  const boxShadow = useTransform([shadowBlur, shadowAlpha], (latest) => {
    const [blur, alpha] = latest as [number, number];
    return `0 ${Math.round(blur / 2)}px ${blur}px rgba(0,0,0,${alpha})`;
  });

  const playedRef = useRef(false);
  useMotionValueEvent(rotateX, "change", (latest) => {
    const inZone = latest > -100 && latest < -80;
    if (inZone && !playedRef.current) {
      playedRef.current = true;
      onFlip?.();
    } else if (!inZone && (latest < -120 || latest > -60)) {
      playedRef.current = false;
    }
  });

  return (
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="relative h-[190dvh]">
      <div
        className="sticky top-0 flex h-dvh items-center justify-center px-6 sm:px-10"
        style={{ perspective: 1600 }}
      >
        {/* decorative peek: paper backs waiting underneath, unflipped */}
        <div
          aria-hidden
          className="pointer-events-none absolute aspect-[4/5] w-full max-w-[380px]"
        >
          {Array.from({ length: peekPaperCount }).map((_, i) => {
            const depth = i + 1;
            const dir = depth % 2 === 0 ? 1 : -1;
            return (
              <div
                key={i}
                className="hairline grain absolute inset-0 rounded-2xl bg-paper dark:bg-paper-dark"
                style={{
                  ["--grain-opacity" as string]: tuning.grainPaper,
                  transform: `translateY(${depth * tuning.peekOffset}px) rotate(${
                    dir * tuning.peekRotate * depth
                  }deg)`,
                  zIndex: -depth,
                  opacity: 1 - depth * 0.14,
                }}
              />
            );
          })}
        </div>

        <motion.div
          className="preserve-3d relative aspect-[4/5] w-full max-w-[380px] rounded-2xl"
          style={{ rotateX, y: liftY, transformOrigin: "50% 50%", boxShadow }}
        >
          {/* paper-thickness edge, only visible edge-on mid-flip */}
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-0 h-full rounded-2xl bg-neutral-300 dark:bg-neutral-700"
            style={{ opacity: edgeOpacity, transform: "translateZ(-1px)" }}
          />

          <div className="backface-hidden preserve-3d absolute inset-0 overflow-hidden rounded-2xl">
            <div
              className="image-outline grain relative h-full w-full"
              style={{ ["--grain-opacity" as string]: tuning.grainPhoto }}
            >
              {front.kind === "photo" ? (
                <Image
                  src={front.photo.src}
                  alt={front.photo.alt}
                  fill
                  sizes="(min-width: 640px) 380px, 90vw"
                  className="object-cover"
                  priority={index < 2}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-900 dark:bg-neutral-100">
                  <p className="font-display text-lg text-neutral-100 dark:text-neutral-900">
                    fin.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            className="backface-hidden hairline grain absolute inset-0 overflow-hidden rounded-2xl bg-paper dark:bg-paper-dark"
            style={{
              transform: "rotateX(180deg)",
              ["--grain-opacity" as string]: tuning.grainPaper,
            }}
          >
            {back.kind === "intro" ? (
              <IntroBack album={album} />
            ) : back.kind === "exif" ? (
              <ExifBack photo={back.photo} />
            ) : (
              <OutroBack album={album} nextAlbum={nextAlbum} />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
