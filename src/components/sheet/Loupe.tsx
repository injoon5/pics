"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type RefObject,
} from "react";
import { useTextMorph } from "torph/react";
import { loupe as loupeTokens, motion as motionTokens } from "@/design/tokens";
import { formatLoupeReadout } from "@/lib/format";
import { playMark } from "@/lib/sound-player";
import type { Photo } from "@/fixtures/types";

export function Loupe({
  photos,
  containerRef,
  active,
  pointerRef,
}: {
  photos: Photo[];
  containerRef: RefObject<HTMLElement | null>;
  active: boolean;
  pointerRef: RefObject<{ x: number; y: number }>;
}) {
  const glassRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastIndexRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  const { ref: morphRef, update } = useTextMorph({
    ease: loupeTokens.morphEase,
    scale: true,
  });

  useEffect(() => {
    if (!active) {
      lastIndexRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingRef.current = false;
      return;
    }

    const tick = () => {
      pendingRef.current = false;
      const container = containerRef.current;
      const glass = glassRef.current;
      const lens = lensRef.current;
      const pointer = pointerRef.current;
      if (!container || !glass || !lens || !pointer) return;

      const { x, y } = pointer;
      const size = glass.offsetWidth || 128;
      const rootRect = (rootRef.current ?? container).getBoundingClientRect();
      glass.style.transform = `translate3d(${x - rootRect.left - size / 2}px, ${y - rootRect.top - size / 2}px, 0)`;

      const el = document.elementFromPoint(x, y);
      const cell = el?.closest<HTMLElement>("[data-photo-index]");
      if (!cell) {
        lens.style.backgroundImage = "none";
        return;
      }

      const index = Number(cell.dataset.photoIndex);
      if (!Number.isFinite(index) || index < 0 || index >= photos.length) return;
      const photo = photos[index]!;
      const rect = cell.getBoundingClientRect();
      const img = cell.querySelector<HTMLImageElement>("img");
      const src = img?.currentSrc || img?.src || photo.src;

      const relX = (x - rect.left) / Math.max(1, rect.width);
      const relY = (y - rect.top) / Math.max(1, rect.height);
      const mag = loupeTokens.magnification;
      const bgW = rect.width * mag;
      const bgH = rect.height * mag;

      lens.style.backgroundImage = `url("${src}")`;
      lens.style.backgroundRepeat = "no-repeat";
      lens.style.backgroundSize = `${bgW}px ${bgH}px`;
      lens.style.backgroundPosition = `${-relX * bgW + size / 2}px ${-relY * bgH + size / 2}px`;

      if (lastIndexRef.current !== index) {
        if (lastIndexRef.current != null) {
          void playMark();
        }
        lastIndexRef.current = index;
        update(formatLoupeReadout(photo.exif));
      }
    };

    const schedule = () => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    };

    // Initial paint + follow pointer moves on the container
    schedule();
    const node = containerRef.current;
    node?.addEventListener("pointermove", schedule, { passive: true });

    return () => {
      node?.removeEventListener("pointermove", schedule);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      pendingRef.current = false;
    };
  }, [active, containerRef, pointerRef, photos, update]);

  const visibleStyle: CSSProperties = {
    opacity: active ? 1 : 0,
    pointerEvents: "none",
    transition: `opacity ${motionTokens.loupeDismissMs}ms var(--ease-out)`,
  };

  return (
    <div
      ref={rootRef}
      aria-hidden={!active}
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      style={visibleStyle}
    >
      <div
        ref={glassRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{ width: 128, height: 128 }}
      >
        <div
          ref={lensRef}
          className="loupe-glass relative h-full w-full overflow-hidden rounded-full"
          style={{
            boxShadow:
              "inset 0 0 0 1.5px oklch(1 0 0 / 0.55), inset 0 0 12px oklch(1 0 0 / 0.25), 0 8px 28px oklch(0 0 0 / 0.28)",
            backgroundColor: "var(--color-surface-sunk)",
          }}
        >
          {/* glass edge highlight */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(120% 80% at 30% 20%, oklch(1 0 0 / 0.35), transparent 55%)",
              mixBlendMode: "soft-light",
            }}
          />
        </div>
        <div
          className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-sm px-2 py-1 type-exif"
          style={{
            background: "color-mix(in oklch, var(--color-surface) 88%, transparent)",
            color: "var(--color-text-secondary)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span ref={morphRef as RefObject<HTMLElement | null>} />
        </div>
      </div>
    </div>
  );
}
