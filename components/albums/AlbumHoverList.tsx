"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import type { Album } from "@/lib/types";

export function AlbumHoverList({ albums }: { albums: Album[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = albums[activeIndex];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1100px] items-center gap-16 px-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-14 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Injoon
          <span className="ml-2 font-normal text-neutral-500">
            Photos, mostly of skylines.
          </span>
        </h1>

        <ul className="flex flex-col gap-1">
          {albums.map((album, i) => (
            <li key={album.slug}>
              <Link
                href={`/albums/${album.slug}`}
                onMouseEnter={() => setActiveIndex(i)}
                onFocus={() => setActiveIndex(i)}
                className="-mx-3 flex items-baseline justify-between gap-4 rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                <h2
                  className={`text-base font-normal transition-colors duration-150 ${
                    activeIndex === i
                      ? "text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  {album.title}
                </h2>
                <span className="tabular-nums shrink-0 text-sm text-neutral-400 dark:text-neutral-600">
                  <NumberFlow value={album.photos.length} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="image-outline grain relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-900"
        style={{ ["--grain-opacity" as string]: 0.04 }}
      >
        <AnimatePresence initial={false} mode="sync">
          {active?.photos[0] ? (
            <motion.div
              key={active.slug}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={active.photos[0].src}
                alt={active.photos[0].alt}
                fill
                sizes="448px"
                className="object-cover"
                priority
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-black/55 to-transparent p-5">
          <p className="text-base font-medium text-white">{active?.title}</p>
          {active?.subtitle ? (
            <p className="text-sm text-white/70">{active.subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
