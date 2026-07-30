"use client";

/**
 * §10 — the light table. Desktop browse.
 *
 * Prints scattered on frosted glass at seeded positions and rotations, gently
 * overlapping. Click raises one to centre; the note appears on a paper slip
 * beside it; arrow keys walk the sequence with no animation at all, because
 * keyboard navigation repeats hundreds of times and animation makes it feel
 * slow (§3.3).
 *
 * Do not port this to mobile, and do not port the contact sheet here. They are
 * the same information in two rooms that work differently.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import type { Album } from "@/fixtures/albums";
import { desktop, durations, springs, cssEase } from "@/design/tokens";
import { seeded } from "@/lib/rng";
import { sources, fallbackSrc } from "@/lib/image";
import { exifLine } from "@/lib/format";

export function LightTable({
  album,
  onClose,
}: {
  album: Album;
  onClose: () => void;
}) {
  const photos = album.photos;
  const [raised, setRaised] = useState<number | null>(null);
  const [idle, setIdle] = useState(false);

  /* The cursor loupe. Interpolated through a spring rather than tracking the
     pointer directly: direct tracking has no momentum and reads as artificial
     — the one thing that most reliably gives away a "custom cursor" (§10). */
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, springs.cursor);
  const sy = useSpring(y, springs.cursor);
  const cursorTransform = useMotionTemplate`translate3d(${sx}px, ${sy}px, 0)`;

  /* The one ambient effect in the build. It should only be noticeable if you
     look away and come back — twenty seconds of stillness, then the glass
     warms over a long ramp. */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const poke = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), desktop.lightTableIdleMs);
    };
    poke();
    window.addEventListener("pointermove", poke);
    window.addEventListener("keydown", poke);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", poke);
      window.removeEventListener("keydown", poke);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      // No animation. Arrow keys jump.
      setRaised((r) => {
        const next = (r ?? -1) + (e.key === "ArrowRight" ? 1 : -1);
        return Math.max(0, Math.min(photos.length - 1, next));
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length, onClose]);

  const layout = useRef(scatter(album)).current;
  const raisedPhoto = raised === null ? null : photos[raised];

  return (
    <div
      className="ambient fixed inset-0 z-50 overflow-hidden"
      onPointerMove={(e) => {
        x.set(e.clientX);
        y.set(e.clientY);
      }}
      style={{
        // Frosted glass, lit from below. The idle drift is a hue and
        // brightness shift measured in tens of seconds, not a pulse.
        background:
          "radial-gradient(120% 90% at 50% 40%, var(--color-surface) 0%, var(--color-surface-sunk) 100%)",
        filter: idle ? "saturate(1.06) brightness(1.02)" : "none",
        transition: "filter 6000ms linear",
        cursor: "none",
      }}
    >
      {photos.map((photo, i) => {
        const s = layout[i];
        const isRaised = raised === i;
        return (
          <button
            key={photo.id}
            type="button"
            aria-label={photo.alt}
            aria-pressed={isRaised}
            onClick={() => setRaised(isRaised ? null : i)}
            className="press-lg absolute block bg-surface p-[6px]"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: "22vw",
              maxWidth: 380,
              borderRadius: "var(--radius-card)",
              transform: isRaised
                ? `translate(-50%, -50%) rotate(0deg) scale(1.35)`
                : `rotate(${s.angle.toFixed(2)}deg)`,
              ...(isRaised ? { left: "50%", top: "50%" } : null),
              zIndex: isRaised ? 40 : 10 + i,
              transition: `transform ${durations.sheetToggle}ms ${cssEase.drawer}, left ${durations.sheetToggle}ms ${cssEase.drawer}, top ${durations.sheetToggle}ms ${cssEase.drawer}`,
              boxShadow: isRaised
                ? "0 18px 44px oklch(0 0 0 / 0.22)"
                : "0 2px 8px oklch(0 0 0 / 0.14)",
            }}
          >
            <picture>
              {sources(photo).map((src) => (
                <source key={src.type} type={src.type} srcSet={src.srcSet} sizes="30vw" />
              ))}
              <img
                src={fallbackSrc(photo)}
                alt=""
                className="block w-full rounded-[2px]"
                style={{ outline: "1px solid rgb(0 0 0 / 0.1)", outlineOffset: -1 }}
                decoding="async"
                loading="lazy"
              />
            </picture>
            <div className="grain" aria-hidden />
          </button>
        );
      })}

      {/* The paper slip beside the raised print. Paper, therefore swapped and
          never morphed (§2.6). */}
      {raisedPhoto && (
        <div
          className="pointer-events-none absolute z-40 w-[230px] bg-surface-recto px-4 py-3"
          style={{
            left: "calc(50% + 12vw + 40px)",
            top: "50%",
            transform: "translateY(-50%) rotate(-0.6deg)",
            borderRadius: "var(--radius-card)",
            boxShadow: "0 6px 18px oklch(0 0 0 / 0.14)",
          }}
        >
          <p className="exif m-0 text-[11px]">{exifLine(raisedPhoto.exif)}</p>
          {raisedPhoto.note && (
            <p className="caption m-0 mt-2 text-[13px]" lang={album.lang}>
              {raisedPhoto.note}
            </p>
          )}
          <div className="grain" aria-hidden />
        </div>
      )}

      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-50 -ml-[13px] -mt-[13px]"
        style={{ transform: cursorTransform }}
      >
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <circle
            cx="13"
            cy="13"
            r="9"
            stroke="var(--color-text-primary)"
            strokeWidth="1.2"
            opacity="0.75"
          />
          <circle cx="13" cy="13" r="9" fill="var(--color-surface)" opacity="0.08" />
        </svg>
      </motion.div>
    </div>
  );
}

/** Seeded scatter — the same album lays out the same way every visit. */
function scatter(album: Album) {
  const rnd = seeded(`${album.slug}:table`);
  const cols = Math.ceil(Math.sqrt(album.photos.length));
  return album.photos.map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Jittered around a loose grid rather than uniformly random: pure random
    // placement clumps, and a clump of prints reads as a mistake. The spread
    // scales with the count and stays centred, so a two-print album is two
    // prints near the middle rather than two prints in opposite corners.
    const spanX = Math.min(62, cols * 18);
    const spanY = Math.min(52, Math.ceil(album.photos.length / cols) * 26);
    const cx = (col - (cols - 1) / 2) / Math.max(cols - 1, 1);
    const rows = Math.ceil(album.photos.length / cols);
    const cy = (row - (rows - 1) / 2) / Math.max(rows - 1, 1);
    return {
      left: 44 + cx * spanX + (rnd() - 0.5) * 8,
      top: 44 + cy * spanY + (rnd() - 0.5) * 8,
      angle: (rnd() - 0.5) * 9,
    };
  });
}
