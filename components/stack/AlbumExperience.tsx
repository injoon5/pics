"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSound } from "@web-kits/audio/react";
import type { Album } from "@/lib/types";
import { enterSound } from "@/lib/audio";
import { PhotoStack } from "./PhotoStack";
import { TopScrim } from "./TopScrim";
import { BottomBar } from "./BottomBar";
import { PhotoGrid } from "@/components/grid/PhotoGrid";
import type { StackView } from "@/components/chrome/ViewToggle";

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

  const playEnter = useSound(enterSound);
  useEffect(() => {
    playEnter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActiveChange = useCallback((index: number) => {
    setActiveIndex(index);
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

  const current = album.photos[Math.min(activeIndex, album.photos.length - 1)];

  return (
    <div className="relative min-h-dvh">
      <TopScrim view={view} onViewChange={handleToggle} />

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
              onActiveChange={handleActiveChange}
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

      {view === "stack" ? (
        <BottomBar
          count={album.photos.length}
          activeIndex={activeIndex}
          title={current?.title ?? album.title}
        />
      ) : null}
    </div>
  );
}
