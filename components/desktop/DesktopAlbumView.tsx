"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import type { Album } from "@/lib/types";
import { ExifBack } from "@/components/stack/ExifBack";

export function DesktopAlbumView({
  album,
  nextAlbum,
}: {
  album: Album;
  nextAlbum: Album | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = itemRefs.current.findIndex((el) => el === entry.target);
          if (idx !== -1) setActiveIndex(idx);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    for (const el of itemRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [album.photos.length]);

  const active = album.photos[activeIndex];

  return (
    <div className="mx-auto flex w-full max-w-[1160px] gap-20 px-10 py-16">
      <div className="sticky top-16 h-[calc(100dvh-8rem)] w-[420px] shrink-0">
        <Link
          href="/albums"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors duration-150 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          All albums
        </Link>

        <h1 className="font-display text-2xl font-medium text-neutral-900 dark:text-neutral-100">
          {album.title}
        </h1>
        {album.subtitle ? (
          <p className="mt-1 text-sm text-neutral-500">{album.subtitle}</p>
        ) : null}

        <div className="relative mt-8 aspect-[4/5] w-full">
          {album.photos.map((photo, i) => {
            const offset = i - activeIndex;
            const isActive = offset === 0;
            return (
              <motion.div
                key={photo.slug}
                className="image-outline grain absolute inset-0 overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-900"
                style={{
                  ["--grain-opacity" as string]: 0.04,
                  zIndex: isActive ? 10 : 10 - Math.abs(offset),
                }}
                animate={{
                  opacity: Math.abs(offset) > 2 ? 0 : isActive ? 1 : 0.5,
                  scale: isActive ? 1 : 0.95 - Math.min(Math.abs(offset), 2) * 0.02,
                  rotate: isActive ? 0 : offset % 2 === 0 ? -2.5 : 2.5,
                  y: isActive ? 0 : Math.abs(offset) * 6,
                }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="420px"
                  className="object-cover"
                  priority={i === 0}
                />
              </motion.div>
            );
          })}
        </div>

        {active ? (
          <p className="mt-4 text-sm text-neutral-500">
            {activeIndex + 1} / {album.photos.length} — {active.slug.replaceAll("-", " ")}
          </p>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 max-w-md">
        <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {album.description}
        </p>

        <div className="mt-16 flex flex-col gap-28">
          {album.photos.map((photo, i) => (
            <div
              key={photo.slug}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800"
            >
              <ExifBack photo={photo} />
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-start gap-3 border-t border-neutral-200 pt-10 dark:border-neutral-800">
          {nextAlbum ? (
            <Link
              href={`/albums/${nextAlbum.slug}`}
              className="active:scale-[0.96] text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-2 transition-transform duration-150 hover:decoration-neutral-500 dark:text-neutral-100 dark:decoration-neutral-700"
            >
              Next album: {nextAlbum.title} →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
