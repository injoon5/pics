"use client";

/**
 * §13 — the reduced-motion pad.
 *
 * "Reduced motion" means fewer and gentler animations, not zero: keep the
 * transitions that explain what happened, remove the ones that move things.
 * So the hinge stays — the split, the print above, its story below, the same
 * reading order — but the card cross-fades instead of rotating through 3D, and
 * the sheen, shadow lag, chinagraph draw-on and ambient drift are all gone.
 *
 * Deliberately a separate tree rather than the same one with the rotation
 * suppressed. Bending the 3D layout into a flat one leaves the print sitting
 * in the bottom pane, upside-down, which explains nothing to anyone.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Album } from "@/fixtures/albums";
import { CaptionBack, IntroBack } from "./Card";
import { FilmCounter } from "./FilmCounter";
import { ContactSheet } from "@/components/sheet/ContactSheet";
import { useStableViewport } from "@/hooks/useStableViewport";
import { useIOSChrome } from "@/hooks/useIOSChrome";
import { useAppearance } from "@/hooks/useAppearance";
import { sources, fallbackSrc } from "@/lib/image";
import { durations } from "@/design/tokens";
import { useUi } from "@/lib/store";
import { unlock } from "@/design/sound";

export function FlatPad({ album }: { album: Album }) {
  const photos = album.photos;
  const cards = photos.length + 1;
  const chrome = useIOSChrome();
  useStableViewport();

  /* Its own scroll tracking, rather than props from Flipbook. Rendering this
     *inside* Flipbook left both trees mounted: two `visualViewport` rAF loops,
     two effects writing the same custom properties, two appearance veils, and
     two `keydown` listeners — so on desktop with reduced motion, `G` opened
     the light table and the contact sheet at the same time. */
  const [index, setIndex] = useState(0);
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const h = window.innerHeight || 1;
      const next = Math.max(0, Math.min(cards - 1, Math.round(window.scrollY / h)));
      setIndex((prev) => (prev === next ? prev : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [cards]);

  const onSelect = useCallback(
    (i: number) => {
      // No animation: reduced motion means the jump *is* the transition.
      window.scrollTo({ top: (i + 1) * (window.innerHeight || 1), behavior: "instant" });
      setSheetOpenRef.current?.(false);
    },
    [],
  );

  const current = index > 0 ? photos[Math.min(index, photos.length) - 1] : undefined;
  useAppearance(current?.palette);

  const sheetOpen = useUi((s) => s.sheetOpen);
  const setSheetOpen = useUi((s) => s.setSheetOpen);
  const setSheetOpenRef = useRef(setSheetOpen);
  setSheetOpenRef.current = setSheetOpen;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "g" || e.key === "G") setSheetOpen(!sheetOpen);
      if (e.key === "Escape" && sheetOpen) setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen, setSheetOpen]);

  return (
    <>
      <div className="pad-sections" aria-hidden>
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="pad-section" />
        ))}
      </div>

      <div className="fixed inset-0">
        {/* Above the hinge: the print. Cross-faded, which is the one thing
            that still needs to say "this changed". */}
        <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: "var(--hinge-y)" }}>
          {photos.map((photo, i) => (
            <figure
              key={photo.id}
              className="mat absolute inset-0 m-0"
              style={{
                opacity: current?.id === photo.id ? 1 : 0,
                transition: `opacity ${durations.appearanceCrossfade}ms var(--ease-out)`,
              }}
              aria-hidden={current?.id !== photo.id}
            >
              <picture>
                {sources(photo).map((s) => (
                  <source key={s.type} type={s.type} srcSet={s.srcSet} sizes="100vw" />
                ))}
                <img
                  src={fallbackSrc(photo)}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  decoding="async"
                  loading={i < 2 ? "eager" : "lazy"}
                />
              </picture>
            </figure>
          ))}
        </div>

        {/* Below the hinge: its story. */}
        <div
          className="face face--back absolute inset-x-0"
          style={{ top: "var(--hinge-y)", height: "var(--pane-h)" }}
        >
          {current ? (
            <CaptionBack photo={current} lang={album.lang} revealExtra={chrome.collapsed} />
          ) : (
            <IntroBack album={album} />
          )}
        </div>
      </div>

      <div className="fixed right-4 z-40" style={{ top: "calc(var(--hinge-y) + 12px)" }}>
        <FilmCounter index={Math.max(index - 1, 0)} total={photos.length} />
      </div>

      <button
        type="button"
        onClick={() => {
          void unlock();
          setSheetOpen(true);
        }}
        aria-label="Browse frames"
        aria-expanded={sheetOpen}
        className="press hit-40 fixed left-1/2 z-40 -translate-x-1/2 rounded-full p-3 text-text-tertiary"
        style={{ top: "calc(var(--hinge-y) - 20px)" }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11.6 11.6 16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      <ContactSheet
        photos={photos}
        index={Math.max(index - 1, 0)}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSelect={onSelect}
        lang={album.lang}
      />
    </>
  );
}
