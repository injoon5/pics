"use client";

import { useEffect, useMemo } from "react";
import { useDialKit } from "dialkit";
import { useSound } from "@web-kits/audio/react";
import type { Album } from "@/lib/types";
import { flipSound } from "@/lib/audio";
import { PhotoCard, type CardBack, type CardFront } from "./PhotoCard";

type Card = {
  id: string;
  front: CardFront;
  back: CardBack;
};

export function PhotoStack({
  album,
  nextAlbum,
  initialIndex,
  onActiveChange,
}: {
  album: Album;
  nextAlbum: Album | null;
  initialIndex?: number | null;
  onActiveChange?: (index: number, total: number) => void;
}) {
  const tuning = useDialKit("Stack", {
    flipStart: [0.08, 0, 0.3, 0.01],
    flipEnd: [0.42, 0.2, 0.7, 0.01],
    liftPx: [14, 0, 40],
    peekOffset: [10, 4, 24],
    peekRotate: [2.5, 0, 8],
    grainPhoto: [0.045, 0, 0.15, 0.005],
    grainPaper: [0.14, 0, 0.3, 0.005],
  });

  const play = useSound(flipSound);

  const cards = useMemo<Card[]>(() => {
    const photoCards: Card[] = album.photos.map((photo, i) => ({
      id: photo.slug,
      front: { kind: "photo", photo },
      back:
        i === 0
          ? { kind: "intro" }
          : { kind: "exif", photo: album.photos[i - 1] },
    }));
    const last = album.photos[album.photos.length - 1];
    const outro: Card = {
      id: "__outro",
      front: { kind: "outro" },
      back: last ? { kind: "exif", photo: last } : { kind: "outro" },
    };
    return [...photoCards, outro];
  }, [album.photos]);

  const sectionRefs = useMemo<React.RefObject<HTMLElement | null>[]>(
    () => cards.map(() => ({ current: null })),
    [cards]
  );

  useEffect(() => {
    if (initialIndex == null) return;
    const el = sectionRefs[initialIndex]?.current;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY + 1;
      window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
    }
    // Runs once when this instance mounts (e.g. jumping in from grid view).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const total = cards.length;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = sectionRefs.findIndex((r) => r.current === entry.target);
          if (idx !== -1) onActiveChange?.(idx, total);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );

    for (const sectionRef of sectionRefs) {
      if (sectionRef.current) observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [cards.length, sectionRefs, onActiveChange]);

  return (
    <div className="relative">
      {cards.map((card, i) => (
        <PhotoCard
          key={card.id}
          front={card.front}
          back={card.back}
          album={album}
          nextAlbum={nextAlbum}
          index={i}
          peekPaperCount={Math.min(2, cards.length - 1 - i)}
          tuning={tuning}
          onFlip={() => play()}
          sectionRef={sectionRefs[i]}
        />
      ))}
    </div>
  );
}
