"use client";

import Link from "next/link";
import Image from "next/image";
import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import type { Album } from "@/lib/types";

export function AlbumListMobile({ albums }: { albums: Album[] }) {
  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+3rem)]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="mb-10"
      >
        <h1 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Injoon
        </h1>
        <p className="text-sm text-neutral-500">Photos, mostly of skylines.</p>
      </motion.div>

      <ul className="flex flex-col gap-8">
        {albums.map((album, i) => {
          const cover = album.photos[0];
          return (
            <motion.li
              key={album.slug}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.08 * i,
                ease: [0.25, 1, 0.5, 1],
              }}
            >
              <Link
                href={`/albums/${album.slug}`}
                className="group block active:scale-[0.96] transition-transform duration-150"
              >
                <div
                  className="image-outline grain relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-900"
                  style={{ ["--grain-opacity" as string]: 0.045 }}
                >
                  {cover ? (
                    <Image
                      src={cover.src}
                      alt={cover.alt}
                      fill
                      sizes="(min-width: 640px) 520px, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-active:scale-[1.03]"
                      priority={i === 0}
                    />
                  ) : null}
                  <div
                    className="absolute inset-x-0 bottom-0 h-2/3"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))",
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <div>
                      <h2 className="text-base font-medium text-white">
                        {album.title}
                      </h2>
                      {album.subtitle ? (
                        <p className="mt-0.5 text-sm text-white/70">
                          {album.subtitle}
                        </p>
                      ) : null}
                    </div>
                    <p className="tabular-nums shrink-0 text-sm text-white/70">
                      <NumberFlow value={album.photos.length} />
                      {" photos"}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
