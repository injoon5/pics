"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { Album, Photo } from "@/lib/types";
import { ExifBack } from "./ExifBack";
import { IntroBack } from "./StackIntro";

export type CardBack = { kind: "intro" } | { kind: "exif"; photo: Photo };

export type StackTuning = {
  pileOffset: number;
  pileRotate: number;
  grainPhoto: number;
  grainPaper: number;
};

/**
 * One print in the pile. Sits face-down in the bottom half with its top edge on
 * the divider, then hinges about that edge and swings up into the top half —
 * revealing the photo on its far face and, beneath it, the next card's back.
 */
export function PhotoCard({
  photo,
  back,
  album,
  index,
  total,
  progress,
  tuning,
  onFlip,
}: {
  photo: Photo;
  back: CardBack;
  album: Album;
  index: number;
  total: number;
  progress: MotionValue<number>;
  tuning: StackTuning;
  onFlip?: () => void;
}) {
  const rotateX = useTransform(progress, [0, 1], [0, -180], { clamp: true });

  // Card 0 sits on top of the face-down pile; once flipped, later cards land on
  // top of earlier ones. The order inverts as each card passes edge-on.
  const zIndex = useTransform(rotateX, (deg) =>
    deg < -90 ? total + index : total - index
  );

  // Shadow deepens as the print lifts off the pile and settles again.
  const shadowBlur = useTransform(rotateX, [0, -90, -180], [10, 30, 14]);
  const shadowAlpha = useTransform(rotateX, [0, -90, -180], [0.12, 0.3, 0.16]);
  const boxShadow = useTransform([shadowBlur, shadowAlpha], (latest) => {
    const [blur, alpha] = latest as [number, number];
    return `0 ${Math.round(blur / 2)}px ${blur}px rgba(0,0,0,${alpha})`;
  });

  // Paper thickness, only catching light while the card is near edge-on.
  const edgeOpacity = useTransform(rotateX, [-60, -90, -120], [0, 1, 0]);

  const playedRef = useRef(false);
  useMotionValueEvent(rotateX, "change", (deg) => {
    const inZone = deg < -80 && deg > -100;
    if (inZone && !playedRef.current) {
      playedRef.current = true;
      onFlip?.();
    } else if (!inZone && (deg > -60 || deg < -120)) {
      playedRef.current = false;
    }
  });

  const dir = index % 2 === 0 ? 1 : -1;
  const depth = Math.min(index, 6);

  return (
    <motion.div
      className="absolute inset-x-0 top-1/2 flex h-0 items-start justify-center"
      style={{ zIndex }}
    >
      <div
        style={{
          transform: `translateY(${depth * tuning.pileOffset}px) rotate(${
            dir * tuning.pileRotate * (depth * 0.5 + 1)
          }deg)`,
        }}
        className="aspect-[4/5] w-[var(--card-w)]"
      >
        <motion.div
          className="preserve-3d relative h-full w-full rounded-2xl"
          style={{ rotateX, transformOrigin: "50% 0%", boxShadow }}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-2xl bg-neutral-300 dark:bg-neutral-600"
            style={{ opacity: edgeOpacity, transform: "translateZ(-1px)" }}
          />

          {/* Face-down side: paper, carrying the intro or the previous EXIF. */}
          <div
            className="backface-hidden hairline grain absolute inset-0 overflow-hidden rounded-2xl bg-paper dark:bg-paper-dark"
            style={{ ["--grain-opacity" as string]: tuning.grainPaper }}
          >
            {back.kind === "intro" ? (
              <IntroBack album={album} />
            ) : (
              <ExifBack photo={back.photo} compact />
            )}
          </div>

          {/* Far side: the photograph, upright once the card has turned over. */}
          <div
            className="backface-hidden absolute inset-0 overflow-hidden rounded-2xl"
            style={{ transform: "rotateX(180deg)" }}
          >
            <div
              className="image-outline grain relative h-full w-full"
              style={{ ["--grain-opacity" as string]: tuning.grainPhoto }}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 640px) 300px, 70vw"
                className="object-cover"
                priority={index < 2}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
