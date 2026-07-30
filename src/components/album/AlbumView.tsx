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

  // Drop browse mode if viewport/pointer no longer qualifies — never port sheet
  useEffect(() => {
    if (!canBrowse && mode === "browse") setMode("book");
  }, [canBrowse, mode]);

  const onSelectIndex = useCallback((i: number) => {
    setIndex(i);
  }, []);

  const showTable = canBrowse && mode === "browse";

  return (
    <div className="relative min-h-dvh bg-surface text-text-primary">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex items-start justify-between px-5 pt-5">
        <Link
          href="/"
          className="pointer-events-auto type-lab-stamp text-[0.75rem] text-text-secondary hover:text-accent"
        >
          ← Sleeves
        </Link>

        {canBrowse ? (
          <div className="pointer-events-auto flex items-center gap-1">
            <ModeButton
              active={mode === "book"}
              onClick={() => setMode("book")}
              label="Book"
            />
            <ModeButton
              active={mode === "browse"}
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
        <Flipbook album={album} />
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
        "type-lab-stamp rounded-[2px] px-2.5 py-1 text-[0.75rem] transition-colors",
        active
          ? "bg-surface-sunk text-accent"
          : "text-text-tertiary hover:text-text-secondary",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
