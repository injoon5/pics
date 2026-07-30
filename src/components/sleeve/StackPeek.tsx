"use client";

import Image from "next/image";
import { hash, mulberry32 } from "@/design/seed";
import { motion, sleeve, stack } from "@/design/tokens";
import type { Photo } from "@/fixtures/types";

export function StackPeek({
  photos,
  albumSlug,
  pressed = false,
}: {
  photos: Photo[];
  albumSlug: string;
  /** When true, peeks slide up by sleeve.printSlidePx */
  pressed?: boolean;
}) {
  const peekN = Math.min(sleeve.peekCount, Math.max(0, photos.length));
  const peeks = photos.slice(0, peekN);
  const layerCount = Math.min(
    stack.maxVisibleLayers,
    Math.max(1, photos.length),
  );
  const rng = mulberry32(hash(`peek:${albumSlug}`));

  // Seeded angles ±peekAngle for each peeking print
  const angled = peeks.map((photo, i) => {
    const sign = i % 2 === 0 ? 1 : -1;
    const angle = sign * sleeve.peekAngle * (0.55 + rng() * 0.45);
    return { photo, angle };
  });

  return (
    <div
      className="pointer-events-none relative w-full"
      style={{
        aspectRatio: "4 / 3",
        transform: pressed
          ? `translateY(-${sleeve.printSlidePx}px)`
          : "translateY(0)",
        transition: `transform ${motion.sleeveFlapMs}ms var(--ease-drawer)`,
      }}
      aria-hidden
    >
      {/* Thickness hairlines — photo-count stack */}
      <div className="absolute inset-x-2 bottom-0">
        {Array.from({ length: layerCount }, (_, i) => {
          const alpha = Math.max(
            0.12,
            stack.hairlineBaseAlpha - i * stack.hairlineAlphaStep,
          );
          return (
            <div
              key={i}
              className="absolute inset-x-0"
              style={{
                bottom: -(i + 1) * stack.layerGap,
                height: 1,
                background: `color-mix(in oklch, var(--color-text-primary) ${alpha * 100}%, transparent)`,
              }}
            />
          );
        })}
      </div>

      {/* Draw back → front so cover sits on top; top shows ~62% of print height */}
      {angled.map(({ photo, angle }, i) => (
        <div
          key={photo.id}
          className="absolute inset-x-[8%] bottom-0 overflow-hidden rounded-[2px] bg-surface-recto"
          style={{
            height: `${sleeve.topPeekHeight * 100}%`,
            zIndex: i + 1,
            transform: `rotate(${angle}deg)`,
            transformOrigin: "50% 100%",
            boxShadow: "0 0 0 0.5px oklch(0 0 0 / 0.08)",
          }}
        >
          <Image
            src={photo.src}
            alt=""
            width={photo.width}
            height={photo.height}
            className="mat-image h-full w-full object-cover"
            sizes="(max-width: 640px) 42vw, 220px"
            draggable={false}
          />
          <div className="paper-grain" />
        </div>
      ))}
    </div>
  );
}
