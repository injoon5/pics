"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  motion as m,
  useMotionValue,
  useSpring,
  type MotionValue,
} from "motion/react";
import { hash, mulberry32, seededJitter } from "@/design/seed";
import { hinge, loupe, motion } from "@/design/tokens";
import type { Photo } from "@/fixtures/types";
import { cn } from "@/lib/cn";

interface Scatter {
  x: number; // % of table width from center
  y: number;
  rot: number;
  z: number;
}

function scatterFor(photos: Photo[]): Scatter[] {
  return photos.map((photo, i) => {
    const j = seededJitter(`table:${photo.id}`, 42, 18);
    const rng = mulberry32(hash(`table-slot:${photo.id}:${i}`));
    // Spiral-ish slots so prints gently overlap
    const ring = 0.22 + (i % 5) * 0.06;
    const theta = (i / Math.max(1, photos.length)) * Math.PI * 2 + rng() * 0.4;
    return {
      x: Math.cos(theta) * ring * 100 + j.dx * 0.35,
      y: Math.sin(theta) * ring * 72 + j.dy * 0.5,
      rot: j.dr * 2.2,
      z: i + 1,
    };
  });
}

function useDesktopBrowseGate() {
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

function LoupeCursor({
  x,
  y,
  visible,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  visible: boolean;
}) {
  return (
    <m.div
      className="pointer-events-none absolute z-50 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-separator bg-surface/30 shadow-[inset_0_0_0_1px_oklch(1_0_0/0.35)] backdrop-blur-[1px]"
      style={{
        left: x,
        top: y,
        opacity: visible ? 1 : 0,
        transition: `opacity ${motion.loupeRevealMs}ms var(--ease-out)`,
      }}
      aria-hidden
    >
      <div className="absolute inset-[3px] rounded-full border border-accent/40" />
    </m.div>
  );
}

export function LightTable({
  photos,
  currentIndex,
  onSelectIndex,
}: {
  photos: Photo[];
  currentIndex: number;
  onSelectIndex: (i: number) => void;
}) {
  const enabled = useDesktopBrowseGate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [idleWarm, setIdleWarm] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, loupe.morphEase);
  const springY = useSpring(rawY, loupe.morphEase);

  const scatters = useMemo(() => scatterFor(photos), [photos]);
  const current = photos[currentIndex];

  const bumpIdle = useCallback(() => {
    setIdleWarm(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdleWarm(true), 20_000);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIdleWarm(true), 20_000);
    idleTimer.current = timer;
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        onSelectIndex(Math.min(photos.length - 1, currentIndex + 1));
        bumpIdle();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        onSelectIndex(Math.max(0, currentIndex - 1));
        bumpIdle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, photos.length, currentIndex, onSelectIndex, bumpIdle]);

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(e.clientX - rect.left);
    rawY.set(e.clientY - rect.top);
    bumpIdle();
  };

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative h-[100dvh] w-full overflow-hidden",
        "cursor-none select-none",
      )}
      style={{
        background: idleWarm
          ? "linear-gradient(160deg, color-mix(in oklch, var(--color-surface) 88%, oklch(0.92 0.03 70)), color-mix(in oklch, var(--color-surface-sunk) 92%, oklch(0.88 0.025 55)))"
          : "linear-gradient(160deg, var(--color-surface-sunk), color-mix(in oklch, var(--color-surface) 70%, var(--color-surface-sunk)))",
        transition: "background 8s var(--ease-in-out)",
        // Frosted glass
        boxShadow: "inset 0 0 80px oklch(1 0 0 / 0.35)",
      }}
      onPointerMove={onPointerMove}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      role="listbox"
      aria-label="Light table"
      aria-activedescendant={current ? `print-${current.id}` : undefined}
    >
      {/* Frost overlay */}
      <div
        className="pointer-events-none absolute inset-0 backdrop-blur-[0.5px]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, oklch(1 0 0 / 0.28), transparent 70%)",
        }}
        aria-hidden
      />

      {photos.map((photo, i) => {
        const s = scatters[i]!;
        const selected = i === currentIndex;
        return (
          <button
            key={photo.id}
            id={`print-${photo.id}`}
            type="button"
            role="option"
            aria-selected={selected}
            className="absolute left-1/2 top-1/2 w-[min(28vw,280px)] origin-center overflow-hidden rounded-[3px] bg-surface p-2 pb-5 text-left shadow-[0_8px_28px_oklch(0_0_0/0.12),inset_0_0_0_1px_oklch(0_0_0/0.06)]"
            style={
              selected
                ? {
                    // Raise to centre — no transition when driven by arrow keys
                    transform: "translate(-50%, -50%) rotate(0deg) scale(1.12)",
                    zIndex: 40,
                    transition: "none",
                  }
                : {
                    transform: `translate(calc(-50% + ${s.x}%), calc(-50% + ${s.y}%)) rotate(${s.rot}deg)`,
                    zIndex: s.z,
                    transition: "none",
                  }
            }
            onClick={() => {
              onSelectIndex(i);
              bumpIdle();
            }}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              className="mat-image aspect-[4/3] w-full object-cover"
              sizes="280px"
              draggable={false}
            />
            <div className="paper-grain" />
          </button>
        );
      })}

      {/* Paper slip with note beside selected print */}
      {current?.note ? (
        <aside
          className="absolute left-1/2 top-1/2 z-[45] w-[min(22vw,220px)] translate-x-[58%] -translate-y-[10%] rotate-[1.2deg] bg-surface-recto px-4 py-3 shadow-[0_4px_18px_oklch(0_0_0/0.08),inset_0_0_0_1px_oklch(0_0_0/0.05)]"
          style={{ transition: "none" }}
        >
          <p className="type-lab-stamp mb-2 text-[0.7rem]">
            {String(currentIndex + 1).padStart(2, "0")}/
            {String(photos.length).padStart(2, "0")}
          </p>
          <p className="type-note text-text-secondary">{current.note}</p>
          <div className="paper-grain opacity-[0.045]" />
        </aside>
      ) : null}

      <LoupeCursor x={springX} y={springY} visible={hovering} />
    </div>
  );
}
