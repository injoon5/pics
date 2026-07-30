"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  LayoutGroup,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { dialDefaults, useDials } from "@/design/dials";
import { card as cardTokens, gesture, hinge, performance } from "@/design/tokens";
import type { Album, Photo } from "@/fixtures/types";
import { playFlip } from "@/lib/sound-player";
import { useUiStore } from "@/store/ui";
import { useWheelNormalize } from "@/components/desktop/useWheelNormalize";
import { ContactSheet } from "../sheet/ContactSheet";
import { BottomRail } from "./BottomRail";
import { Card, TopPrint } from "./Card";
import { FilmCounter } from "./FilmCounter";
import { HingeGrabber } from "./HingeGrabber";
import { ProgressiveBlur } from "./ProgressiveBlur";
import { StackHairlines } from "./StackHairlines";
import { useAppearance } from "./useAppearance";
import { useIOSChrome } from "./useIOSChrome";
import { useMediaAxis } from "./useMediaAxis";
import { useStageGuard } from "./useStageGuard";

export interface FlipbookProps {
  album: Album;
}

function detectCssScrollTimeline(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;
  return CSS.supports("animation-timeline", "scroll()");
}

function IntroBack({ text }: { text: string }) {
  return <p className="type-intro">{text}</p>;
}

function CaptionBack({ note }: { note?: string }) {
  return note ? <p className="type-note text-text-secondary">{note}</p> : null;
}

function SleeveBack({
  note,
  colophon,
}: {
  note?: string;
  colophon?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {note ? <p className="type-note text-text-secondary">{note}</p> : null}
      {colophon ? <p className="type-lab-stamp">{colophon}</p> : null}
    </div>
  );
}

function backForIndex(
  index: number,
  photos: Photo[],
  intro: string,
  colophon?: string,
): ReactNode {
  if (index === 0) return <IntroBack text={intro} />;
  if (index >= photos.length) {
    const last = photos[photos.length - 1];
    return <SleeveBack note={last?.note} colophon={colophon} />;
  }
  const prev = photos[index - 1];
  return <CaptionBack note={prev?.note} />;
}

export function Flipbook({ album }: FlipbookProps) {
  const photos = album.photos;
  const cardCount = photos.length + 1; // + empty sleeve
  const maxG = photos.length; // scroll progress units

  const dials = useDials("Flipbook", dialDefaults) as {
    Hinge?: { ratio?: number; perspective?: number };
    Card?: { thickness?: number; grainOpacity?: number };
  };
  const hingeRatio =
    typeof dials.Hinge?.ratio === "number" ? dials.Hinge.ratio : hinge.ratio;
  const perspective =
    typeof dials.Hinge?.perspective === "number"
      ? dials.Hinge.perspective
      : hinge.perspective;
  const thickness =
    typeof dials.Card?.thickness === "number"
      ? dials.Card.thickness
      : cardTokens.thickness;
  const grainOpacity =
    typeof dials.Card?.grainOpacity === "number"
      ? dials.Card.grainOpacity
      : cardTokens.grainOpacity;

  const axis = useMediaAxis();
  const { chromeInset, stableHeight, collapsed } = useIOSChrome(hingeRatio);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  useStageGuard(stageRef);

  const sheetOpen = useUiStore((s) => s.sheetOpen);
  const setSheetOpen = useUiStore((s) => s.setSheetOpen);
  const lastSettledIndex = useUiStore((s) => s.lastSettledIndex);
  const setLastSettledIndex = useUiStore((s) => s.setLastSettledIndex);

  const [useCssTimeline, setUseCssTimeline] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [settledIndex, setSettledIndex] = useState(lastSettledIndex);
  const lastFlipSoundAt = useRef(-1);

  useEffect(() => {
    setUseCssTimeline(detectCssScrollTimeline());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--thickness", `${thickness}px`);
    document.documentElement.style.setProperty(
      "--grain-opacity",
      String(grainOpacity),
    );
  }, [thickness, grainOpacity]);

  const { scrollY } = useScroll({ container: scrollerRef });

  const pageH = stableHeight > 0 ? stableHeight : 1;
  const g: MotionValue<number> = useTransform(scrollY, (y) => y / pageH);

  const mountedStart = Math.max(
    0,
    Math.min(settledIndex, Math.max(0, cardCount - performance.mountedCards)),
  );
  const mountedIndices = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < performance.mountedCards; i++) {
      const idx = mountedStart + i;
      if (idx < cardCount) out.push(idx);
    }
    return out;
  }, [mountedStart, cardCount]);

  const settleTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(index, maxG));
      if (next === settledIndex) return;
      setSettledIndex(next);
      setLastSettledIndex(next);
      if (next !== lastFlipSoundAt.current) {
        lastFlipSoundAt.current = next;
        void playFlip();
      }
    },
    [maxG, settledIndex, setLastSettledIndex],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const readIndex = () => {
      const h = el.clientHeight || pageH;
      settleTo(Math.round(el.scrollTop / h));
    };

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(readIndex, gesture.soundRateLimitMs);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", readIndex);
    return () => {
      if (debounce) clearTimeout(debounce);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", readIndex);
    };
  }, [pageH, settleTo]);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "auto") => {
      const el = scrollerRef.current;
      if (!el) return;
      const h = el.clientHeight || pageH;
      const clamped = Math.max(0, Math.min(index, maxG));
      el.scrollTo({ top: clamped * h, behavior });
      settleTo(clamped);
    },
    [maxG, pageH, settleTo],
  );

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        setSheetOpen(true);
        return;
      }
      if (e.key === "Escape") {
        setSheetOpen(false);
        return;
      }
      if (sheetOpen) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        scrollToIndex(settledIndex + 1, "auto");
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToIndex(settledIndex - 1, "auto");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollToIndex, setSheetOpen, settledIndex, sheetOpen]);

  // Mouse wheel → one flip per notch (trackpad continuous scroll left alone)
  const onWheelStep = useCallback(
    (direction: -1 | 1) => {
      if (sheetOpen || reducedMotion) return;
      scrollToIndex(settledIndex + direction, "auto");
    },
    [reducedMotion, scrollToIndex, settledIndex, sheetOpen],
  );
  useWheelNormalize(onWheelStep, scrollerRef);

  // Appearance from settled photo (or first / intro fallback)
  const settledPhoto =
    settledIndex >= 1 ? photos[Math.min(settledIndex, photos.length) - 1]! : photos[0]!;
  const meanL = settledPhoto?.palette.meanL ?? 0.97;
  const shadowHue = settledPhoto?.palette.shadowHue ?? 86;
  useAppearance(meanL, shadowHue);

  const railPhoto =
    settledIndex >= 1 ? photos[Math.min(settledIndex, photos.length) - 1]! : null;

  const topPhoto =
    settledIndex >= 1 ? photos[Math.min(settledIndex, photos.length) - 1]! : null;

  const remaining = Math.max(0, photos.length - settledIndex);
  const bandTop = topPhoto?.palette.topBand ?? "var(--color-surface)";
  const bandBottom =
    (settledIndex < photos.length
      ? photos[Math.min(settledIndex, photos.length - 1)]?.palette.bottomBand
      : photos[photos.length - 1]?.palette.bottomBand) ?? "var(--color-surface)";

  const filmCurrent = Math.min(settledIndex, photos.length);

  return (
    <LayoutGroup id="flipbook-sheet">
    <div className="relative h-[100dvh] bg-surface text-text-primary">
      <div ref={scrollerRef} className="scroller" tabIndex={0} aria-label="Flipbook scroll">
        {Array.from({ length: cardCount }, (_, i) => (
          <div key={i} className="scroller-spacer" aria-hidden />
        ))}
      </div>

      {!sheetOpen && (
        <div
          ref={stageRef}
          className="stage"
          data-axis={axis}
          style={{
            height: stableHeight || "100dvh",
            perspective: `${perspective}px`,
            // chromeInset available for future layout; CSS var already set
            ["--chrome-inset-js" as string]: `${chromeInset}px`,
          }}
        >
          {topPhoto ? <TopPrint photo={topPhoto} visible /> : null}

          <StackHairlines
            remaining={remaining}
            total={photos.length}
            seedId={album.slug}
          />

          {mountedIndices.map((i) => {
            const photo = i < photos.length ? photos[i]! : null;
            return (
              <Card
                key={i}
                photo={photo}
                backContent={backForIndex(i, photos, album.intro, album.colophon)}
                index={i}
                g={g}
                axis={axis}
                useCssTimeline={useCssTimeline && !reducedMotion}
                reducedMotion={reducedMotion}
              />
            );
          })}
        </div>
      )}

      <ProgressiveBlur bandColor={bandTop} edge="top" />
      <ProgressiveBlur bandColor={bandBottom} edge="bottom" />

      <BottomRail photo={railPhoto} collapsed={collapsed} />
      <FilmCounter current={filmCurrent} total={photos.length} />

      <HingeGrabber onOpen={() => setSheetOpen(true)} />

      <ContactSheet
        album={album}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentIndex={settledIndex}
        onSelectIndex={(index) => {
          setSheetOpen(false);
          scrollToIndex(index, "auto");
        }}
      />
    </div>
    </LayoutGroup>
  );
}
