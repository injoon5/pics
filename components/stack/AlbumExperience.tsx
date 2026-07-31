"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSound } from "@web-kits/audio/react";
import type { Album } from "@/lib/types";
import { enterSound } from "@/lib/audio";
import { PhotoStack } from "./PhotoStack";
import { TopScrim } from "./TopScrim";
import { BottomBar } from "./BottomBar";
import { PhotoGrid } from "@/components/grid/PhotoGrid";
import { ViewToggle, type StackView } from "@/components/chrome/ViewToggle";

export function AlbumExperience({
  album,
  nextAlbum,
}: {
  album: Album;
  nextAlbum: Album | null;
}) {
  const [view, setView] = useState<StackView>("stack");
  const [jumpToIndex, setJumpToIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [total, setTotal] = useState(album.photos.length + 1);

  const playEnter = useSound(enterSound);
  useEffect(() => {
    playEnter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectFromGrid(index: number) {
    setJumpToIndex(index);
    setView("stack");
  }

  function handleToggle(next: StackView) {
    setView(next);
    if (next === "grid") window.scrollTo({ top: 0 });
    else setJumpToIndex(null);
  }

  const currentPhoto =
    album.photos[Math.min(activeIndex, album.photos.length - 1)] ?? null;
  const color = currentPhoto?.color.average ?? album.accent ?? "#8a8a8a";
  const note = view === "stack" ? currentPhoto?.note ?? "" : "";

  return (
    <div className="relative min-h-dvh">
      <TopScrim album={album} activeIndex={activeIndex} total={total} color={color} />

      <div
        className="fixed inset-x-0 z-30 flex justify-center"
        style={{ top: "calc(env(safe-area-inset-top) + 3.75rem)" }}
      >
        <ViewToggle view={view} onChange={handleToggle} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {view === "stack" ? (
          <motion.div
            key="stack"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PhotoStack
              album={album}
              nextAlbum={nextAlbum}
              initialIndex={jumpToIndex}
              onActiveChange={(index, t) => {
                setActiveIndex(index);
                setTotal(t);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PhotoGrid album={album} onSelect={handleSelectFromGrid} />
          </motion.div>
        )}
      </AnimatePresence>

      {view === "stack" ? <BottomBar note={note} /> : null}
    </div>
  );
}
