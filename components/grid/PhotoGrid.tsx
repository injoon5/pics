"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useSound } from "@web-kits/audio/react";
import { tapSound } from "@/lib/audio";
import type { Album } from "@/lib/types";

export function PhotoGrid({
  album,
  onSelect,
}: {
  album: Album;
  onSelect: (index: number) => void;
}) {
  const playTap = useSound(tapSound);

  return (
    <div
      className="mx-auto grid w-full max-w-[640px] grid-cols-2 gap-2.5 px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 4rem)" }}
    >
      {album.photos.map((photo, i) => (
        <motion.button
          key={photo.slug}
          type="button"
          onClick={() => {
            playTap();
            onSelect(i);
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            delay: Math.min(i, 8) * 0.04,
            ease: [0.25, 1, 0.5, 1],
          }}
          className="active:scale-[0.96] image-outline relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-200 text-left transition-transform duration-150 dark:bg-neutral-900"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 640px) 320px, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2.5">
            <p className="truncate text-sm text-white">{photo.title}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
