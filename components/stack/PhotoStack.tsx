"use client";

import { useEffect, useRef, useState } from "react";
import { useDialKit } from "dialkit";
import { useSound } from "@web-kits/audio/react";
import { useMotionValueEvent, useScroll, useTransform } from "motion/react";
import type { Album } from "@/lib/types";
import { flipSound } from "@/lib/audio";
import { PhotoCard, type CardBack } from "./PhotoCard";
import { OutroPanel } from "./StackIntro";
import { ExifBack } from "./ExifBack";

export function PhotoStack({
  album,
  nextAlbum,
  initialIndex,
  onActiveChange,
}: {
  album: Album;
  nextAlbum: Album | null;
  initialIndex?: number | null;
  onActiveChange?: (index: number) => void;
}) {
  const tuning = useDialKit("Stack", {
    scrollPerCard: [85, 40, 160, 5],
    // Vertical room reserved above and below the fold for the floating chrome.
    chromeGap: [86, 40, 160, 2],
    maxCardVw: [74, 45, 92, 1],
    flipSpan: [0.82, 0.4, 1, 0.02],
    pileOffset: [3, 0, 14, 0.5],
    pileRotate: [0.9, 0, 5, 0.1],
    grainPhoto: [0.045, 0, 0.15, 0.005],
    grainPaper: [0.14, 0, 0.3, 0.005],
  });

  const play = useSound(flipSound);
  const containerRef = useRef<HTMLDivElement>(null);
  const photos = album.photos;
  const count = photos.length;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = Math.max(0, Math.min(Math.floor(p * count), count - 1));
    setActive((prev) => (prev === idx ? prev : idx));
  });

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  // Entering from the grid: land on that photo's slice of the scroll range.
  useEffect(() => {
    if (initialIndex == null) return;
    const el = containerRef.current;
    if (!el) return;
    const scrollable = el.offsetHeight - window.innerHeight;
    // Land where the chosen print has finished turning over, not where its
    // flip begins — otherwise tapping a photo shows the one before it.
    const at = (initialIndex + tuning.flipSpan) / Math.max(count, 1);
    window.scrollTo({
      top: el.offsetTop + scrollable * Math.min(at, 1),
      behavior: "instant" as ScrollBehavior,
    });
    // Runs once when this instance mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastPhoto = photos[count - 1];

  // Height is capped by the shorter half so the card always clears the chrome.
  const cardWidth = `min(calc((50dvh - ${tuning.chromeGap}px) * 0.8), ${tuning.maxCardVw}vw, 300px)`;

  return (
    <>
      <div
        ref={containerRef}
        style={{
          height: `calc(${count} * ${tuning.scrollPerCard}dvh + 100dvh)`,
          ["--card-w" as string]: cardWidth,
        }}
      >
        <div className="sticky top-0 h-dvh overflow-hidden">
          <div className="absolute inset-0" style={{ perspective: 1800 }}>
            {/* The fold every print hinges on. */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-1/2 h-px bg-black/[0.07] dark:bg-white/[0.07]"
            />

            {/* Bottom of the pile — the last photo's notes, once it empties. */}
            <div className="absolute inset-x-0 top-1/2 z-0 flex h-0 items-start justify-center">
              <div
                className="hairline grain aspect-[4/5] w-[var(--card-w)] overflow-hidden rounded-2xl bg-paper dark:bg-paper-dark"
                style={{ ["--grain-opacity" as string]: tuning.grainPaper }}
              >
                {lastPhoto ? <ExifBack photo={lastPhoto} compact /> : null}
              </div>
            </div>

            {photos.map((photo, i) => (
              <CardSlice
                key={photo.slug}
                photo={photo}
                back={
                  i === 0
                    ? { kind: "intro" }
                    : { kind: "exif", photo: photos[i - 1] }
                }
                album={album}
                index={i}
                total={count}
                start={i / count}
                end={(i + tuning.flipSpan) / count}
                scrollYProgress={scrollYProgress}
                tuning={tuning}
                onFlip={() => play()}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Closing panel, after the pinned stage has released. */}
      <div
        className="relative flex min-h-[85dvh] items-center justify-center px-6"
        style={{ ["--card-w" as string]: cardWidth }}
      >
        <div className="hairline aspect-[4/5] w-[var(--card-w)] overflow-hidden rounded-2xl">
          <OutroPanel album={album} nextAlbum={nextAlbum} />
        </div>
      </div>
    </>
  );
}

function CardSlice({
  scrollYProgress,
  start,
  end,
  ...rest
}: {
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  start: number;
  end: number;
} & Omit<React.ComponentProps<typeof PhotoCard>, "progress">) {
  const progress = useTransform(scrollYProgress, [start, end], [0, 1], {
    clamp: true,
  });
  return <PhotoCard {...rest} progress={progress} />;
}

export type { CardBack };
