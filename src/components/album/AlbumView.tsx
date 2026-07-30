"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LightTable } from "@/components/desktop/LightTable";
import { Flipbook } from "@/components/flip/Flipbook";
import { hinge } from "@/design/tokens";
import type { Album } from "@/fixtures/types";
import { cn } from "@/lib/cn";

type ViewMode = "book" | "browse";

function useCanBrowseDesktop() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const q = window.matchMedia(
      `(pointer: fine) and (min-width: ${hinge.bookMinWidth}px)`,
    );
    const sync = () => setOk(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  return ok;
}

export function AlbumView({ album }: { album: Album }) {
  const canBrowse = useCanBrowseDesktop();
  const [mode, setMode] = useState<ViewMode>("book");
  const [index, setIndex] = useState(0);

  const onSelectIndex = useCallback((i: number) => {
    setIndex(i);
  }, []);

  const effectiveMode: ViewMode = canBrowse ? mode : "book";
  const showTable = effectiveMode === "browse";

  return (
    <div className="relative min-h-dvh bg-surface text-text-primary">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex items-start justify-between px-5 pt-5">
        {/* Scrim so link stays readable over dark prints */}
        <Link
          href="/"
          className={cn(
            "pointer-events-auto rounded-sm px-2 py-1 text-[0.75rem]",
            "bg-surface/80 text-text-secondary backdrop-blur-[2px]",
            "type-bench-count hover:text-accent",
          )}
        >
          ← Sleeves
        </Link>

        {canBrowse ? (
          <div
            className={cn(
              "pointer-events-auto flex items-center gap-0.5 rounded-sm px-1 py-0.5",
              "bg-surface/80 backdrop-blur-[2px]",
            )}
          >
            <ModeButton
              active={effectiveMode === "book"}
              onClick={() => setMode("book")}
              label="Book"
            />
            <ModeButton
              active={effectiveMode === "browse"}
              onClick={() => setMode("browse")}
              label="Browse"
            />
          </div>
        ) : null}
      </header>

      {showTable ? (
        <LightTable
          photos={album.photos}
          currentIndex={index}
          onSelectIndex={onSelectIndex}
        />
      ) : (
        <Flipbook key={album.slug} album={album} />
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "type-bench-count rounded-[2px] px-2 py-1 text-[0.75rem] transition-colors",
        active
          ? "text-accent"
          : "text-text-tertiary hover:text-text-secondary",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
