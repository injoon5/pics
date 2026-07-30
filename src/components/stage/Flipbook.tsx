"use client";

/**
 * §4 — the hinge engine.
 *
 * The viewport is split at the hinge. Below it, the unflipped pile, backs up:
 * you are looking at the back of card n+1. Above it, the flipped pile, faces
 * up: you are looking at photo n. Scrolling rotates the top card of the bottom
 * pile up and over. It is a pure function of scroll position.
 *
 * Two things about the scroll model are load-bearing:
 *
 * 1. It is a *real* scroll container, and it is the document. Momentum,
 *    accessibility, the scrollbar and iOS's URL-bar behaviour all come free
 *    and cannot be faithfully reimplemented. A nested `overflow-y: scroll`
 *    div would work for the flip and would then never collapse Safari's URL
 *    bar, which is the entire subject of §7.2 — and it would put the CSS
 *    scroll timeline out of reach of the fixed card layer, since `scroll()`
 *    resolves against *ancestor* scrollers.
 *
 * 2. The sections are empty spacers. The cards live in a `position: fixed`
 *    layer above them and never scroll; they only rotate.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useVelocity,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { Album } from "@/fixtures/albums";
import { Card, CaptionBack, IntroBack, ColophonBack } from "./Card";
import { Stack } from "./Stack";
import { FilmCounter } from "./FilmCounter";
import { ProgressiveBlur } from "@/components/chrome/ProgressiveBlur";
import { ContactSheet } from "@/components/sheet/ContactSheet";
import { FlatPad } from "./FlatPad";
import { useStableViewport } from "@/hooks/useStableViewport";
import { useIOSChrome } from "@/hooks/useIOSChrome";
import { useAppearance } from "@/hooks/useAppearance";
import { useWheelNormalise } from "@/hooks/useWheelNormalise";
import { useHingeDrag } from "@/hooks/useHingeDrag";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { play, unlock, velocityFromRelease } from "@/design/sound";
import { useUi } from "@/lib/store";
import { warmDecode } from "@/lib/image";
import { clamp } from "@/lib/gesture";
import { appearanceFor } from "@/lib/color";
import { blur, budget, hinge as hingeTokens } from "@/design/tokens";
import { useDials } from "@/design/dials";

export function Flipbook({
  album,
  /** Desktop hands browse to the light table instead. §10 is explicit that the
   *  sheet does not get ported to desktop, so on desktop it is not mounted at
   *  all and `G` belongs to the caller. */
  onBrowse,
}: {
  album: Album;
  onBrowse?: () => void;
}) {
  const photos = album.photos;
  /** Cards, not photos: there is one more card than photo. The last is an
   *  empty sleeve holding the final caption and the colophon (§1). */
  const cards = photos.length + 1;

  const reduced = useReducedMotion();
  const [axis, setAxis] = useState<"x" | "y">("y");
  const [cssPath, setCssPath] = useState(false);
  const [index, setIndex] = useState(0);

  const chrome = useIOSChrome();
  useStableViewport();

  const p = useDials("Hinge", {
    ratio: [hingeTokens.ratio, 0.25, 0.75],
    topBlur: [blur.topExtent, 0, 0.6],
    bottomBlur: [blur.bottomExtent, 0, 0.6],
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--hinge-ratio", String(p.ratio));
  }, [p.ratio]);

  // Published so `.bottom-rail` can keep the caption's last line clear of the
  // bottom blur band (see globals.css).
  useEffect(() => {
    const h = Math.round((window.innerHeight * (1 - p.ratio) || 0) * p.bottomBlur);
    document.documentElement.style.setProperty("--blur-bottom", `${h}px`);
  }, [p.ratio, p.bottomBlur]);

  /* ── path selection ────────────────────────────────────────────────────
     The primary flip is a native CSS scroll-driven animation: Safari 26
     supports `animation-timeline: scroll()` and it runs on the compositor,
     which means it stays in perfect sync during a fast fling — exactly the
     case where a useScroll + rAF implementation visibly desyncs. Motion is
     the fallback, and stays the path for everything interruptible.

     Detected after mount rather than at render, because the server has no
     opinion about CSS support and a mismatch would hydrate wrong. */
  useEffect(() => {
    setCssPath(CSS.supports("animation-timeline", "scroll()"));
  }, []);

  /* ── desktop axis swap (§4.5) — same component, quarter-turned hinge ─── */
  useEffect(() => {
    const mq = matchMedia(
      `(pointer: fine) and (min-width: ${hingeTokens.bookModeMinWidth}px)`,
    );
    const apply = () => setAxis(mq.matches ? "x" : "y");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* ── the one source of truth ───────────────────────────────────────────
     g ∈ [0, cards−1]. Card c's rotation is clamp(g − c, 0, 1). Both paths
     read the same number; the CSS path just gets there without JS. */
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const g = useMotionValue(0);

  const viewport = useRef(1);
  useEffect(() => {
    const measure = () => {
      viewport.current = window.innerHeight || 1;
    };
    measure();
    window.addEventListener("orientationchange", measure);
    return () => window.removeEventListener("orientationchange", measure);
  }, []);

  useMotionValueEvent(scrollY, "change", (y) => {
    g.set(clamp(y / viewport.current, 0, cards - 1));
  });

  /* ── the mounted window ────────────────────────────────────────────────
     Three cards: the one before (top of the flipped pile), the one flipping,
     and the one behind it. Everything below is the hairline stack, which is
     one node (§5.3). React re-renders once per index crossed and at no other
     time during a scroll (§0.3). */
  const settled = useRef(0);
  useMotionValueEvent(g, "change", (v) => {
    const next = Math.round(v);
    if (next !== settled.current) {
      settled.current = next;
      setIndex(next);
    }
  });

  /* ── settle ────────────────────────────────────────────────────────────
     The flip is continuous; the sound is discrete. One `flip` per landing,
     for the card that actually landed — a fling across eight cards is one
     sound, not eight (§7.6). */
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSounded = useRef(0);

  /* The velocity that matters is the one the gesture *had*, not the one it has
     at rest. Reading `useVelocity` inside the settle handler would sample it
     after the scroll has stopped, which is zero by definition — every flip
     would then sound identical and §7.6's "a gentle scroll should sound
     different from a hard flick" would be quietly unmet. So keep the peak of
     the run and consume it on landing. */
  const peakVelocity = useRef(0);
  useMotionValueEvent(velocity, "change", (v) => {
    const abs = Math.abs(v);
    if (abs > peakVelocity.current) peakVelocity.current = abs;
  });

  const onSettle = useCallback(() => {
    const landed = Math.round(g.get());
    if (landed !== lastSounded.current) {
      lastSounded.current = landed;
      play("flip", velocityFromRelease(peakVelocity.current));
    }
    peakVelocity.current = 0;
    useUi.getState().setLastSettledIndex(landed);
  }, [g]);

  useEffect(() => {
    const onScrollEnd = () => onSettle();
    const debounced = () => {
      clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(onSettle, 130);
    };

    // `scrollend` is the accurate signal; the debounce is the fallback, and
    // 130ms is long enough to sit past the snap animation without letting the
    // sound drift outside the 30ms coincidence window on the path that has it.
    const hasScrollEnd = "onscrollend" in globalThis;
    if (hasScrollEnd) {
      window.addEventListener("scrollend", onScrollEnd);
      return () => window.removeEventListener("scrollend", onScrollEnd);
    }
    window.addEventListener("scroll", debounced, { passive: true });
    return () => {
      window.removeEventListener("scroll", debounced);
      clearTimeout(settleTimer.current);
    };
  }, [onSettle]);

  /* ── the photo currently on top of the flipped pile ─────────────────── */
  const current = index > 0 ? photos[Math.min(index, photos.length) - 1] : undefined;
  useAppearance(current?.palette);

  // §7.4 — decode ahead. An undecoded image appearing mid-flip is the most
  // visible jank in the app.
  useEffect(() => {
    for (let k = 0; k <= budget.decodeAhead; k++) {
      const photo = photos[index + k];
      if (photo) warmDecode(photo);
    }
  }, [index, photos]);

  /* ── keyboard (§7.5) — nothing animates on a keyboard action ─────────── */
  const jump = useCallback(
    (to: number, smooth = false) => {
      window.scrollTo({
        top: clamp(to, 0, cards - 1) * viewport.current,
        behavior: smooth ? "smooth" : "instant",
      });
    },
    [cards],
  );

  const sheetOpen = useUi((s) => s.sheetOpen);
  const setSheetOpen = useUi((s) => s.setSheetOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const at = Math.round(g.get());

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
        case " ":
          e.preventDefault();
          jump(at + 1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          jump(at - 1);
          break;
        case "g":
        case "G":
          e.preventDefault();
          if (onBrowse) onBrowse();
          else setSheetOpen(!sheetOpen);
          break;
        case "Escape":
          if (sheetOpen) setSheetOpen(false);
          break;
        default:
          if (/^[1-9]$/.test(e.key)) {
            e.preventDefault();
            jump(Number(e.key));
          }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [g, jump, sheetOpen, setSheetOpen, onBrowse]);

  const scrollerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    scrollerRef.current = document.documentElement;
  }, []);

  const stepWheel = useCallback(
    (direction: 1 | -1) => jump(Math.round(g.get()) + direction, true),
    [g, jump],
  );
  useWheelNormalise(scrollerRef, stepWheel, axis === "x");

  /* ── select from the contact sheet ─────────────────────────────────────
     Scroll position is set imperatively, without animation, *before* the
     layout animation runs — otherwise the shared-layout flight lands against
     a stale hinge (§8). */
  const onSelect = useCallback(
    (i: number) => {
      jump(i + 1);
      setSheetOpen(false);
      play("land");
    },
    [jump, setSheetOpen],
  );

  const openBrowse = useCallback(() => {
    void unlock();
    if (onBrowse) onBrowse();
    else setSheetOpen(true);
  }, [onBrowse, setSheetOpen]);

  const hingeDrag = useHingeDrag(openBrowse);

  const window3 = useMemo(
    () => [index - 1, index, index + 1].filter((c) => c >= 0 && c < cards),
    [index, cards],
  );

  if (reduced) {
    return <FlatPad album={album} index={index} cards={cards} onSelect={onSelect} />;
  }

  const remaining = cards - index;
  const paneBlurTop = Math.round((viewport.current * p.ratio || 0) * p.topBlur);
  const paneBlurBottom = Math.round(
    (viewport.current * (1 - p.ratio) || 0) * p.bottomBlur,
  );

  return (
    <>
      {/* The scroll sections. Empty spacers: `scroll-snap-stop: always` on
          every one, because without it a hard flick skips three photos and
          the pile appears to teleport (§4.2). */}
      <div className="pad-sections" aria-hidden>
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="pad-section" />
        ))}
      </div>

      {/* The 3D context. Nothing above this element may set opacity, a
          filter, a backdrop-filter, a mask, or overflow:hidden with a radius
          — every one of them flattens it on iOS (§5.6). */}
      <div className="stage" data-axis={axis} data-path={cssPath ? "css" : "motion"}>
        {/* The flipped pile, above the hinge: mirrored hairlines under the
            print you're looking at. */}
        <Stack
          remaining={index + 1}
          total={cards}
          direction="up"
          axis={axis}
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{ height: "var(--hinge-y)" }}
        />

        {window3.map((c) => (
          <CardAt
            key={c}
            c={c}
            g={g}
            album={album}
            cssPath={cssPath}
            axis={axis}
            chromeCollapsed={chrome.collapsed}
            reduced={false}
          />
        ))}

        {/* The unflipped pile below. One node, N box-shadows. */}
        <Stack
          remaining={remaining}
          total={cards}
          direction="down"
          axis={axis}
          className="pointer-events-none absolute inset-x-0"
          style={{ top: "var(--hinge-y)", height: "var(--pane-h)", zIndex: -1 }}
        />
      </div>

      {/* Siblings of the stage, never children (§5.6). */}
      {current && (
        <>
          <ProgressiveBlur
            edge="top"
            band={current.palette.topBand}
            thumbhash={current.thumbhash}
            height={paneBlurTop}
          />
          <ProgressiveBlur
            edge="bottom"
            band={current.palette.bottomBand}
            thumbhash={current.thumbhash}
            height={paneBlurBottom}
          />
        </>
      )}

      {/* §5.3 — the counter on the right edge. Below the hinge, not above it:
          the print's own frame number sits in the mat's bottom margin, and two
          numbers on the same line read as one broken label. */}
      <div className="fixed right-4 z-40" style={{ top: "calc(var(--hinge-y) + 12px)" }}>
        <FilmCounter index={Math.max(index - 1, 0)} total={photos.length} />
      </div>

      {/* Press the loupe at the hinge to browse (§8). 40×40 minimum, and the
          only interactive element inside the stage's footprint. */}
      <button
        type="button"
        onClick={() => {
          // A completed drag already opened it, or already decided not to.
          if (!hingeDrag.wasDrag()) openBrowse();
        }}
        {...hingeDrag.handlers}
        aria-label="Browse frames"
        aria-expanded={sheetOpen}
        className="press hit-40 fixed left-1/2 z-40 -translate-x-1/2 touch-none rounded-full p-3 text-text-tertiary"
        style={{ top: "calc(var(--hinge-y) - 20px)" }}
      >
        <LoupeGlyph />
      </button>

      {!onBrowse && (
        <ContactSheet
          photos={photos}
          index={Math.max(index - 1, 0)}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSelect={onSelect}
          lang={album.lang}
        />
      )}
    </>
  );
}

/**
 * One card, with its own derived rotation value and z-index handoff.
 *
 * Split out so each card owns exactly one `useTransform` chain: hoisting these
 * into the parent would mean rebuilding all three on every window change.
 */
function CardAt({
  c,
  g,
  album,
  cssPath,
  axis,
  chromeCollapsed,
}: {
  c: number;
  g: MotionValue<number>;
  album: Album;
  cssPath: boolean;
  axis: "x" | "y";
  chromeCollapsed: boolean;
  reduced: boolean;
}) {
  const photos = album.photos;
  const u = useTransform(g, (v) => clamp(v - c, 0, 1));
  const ref = useRef<HTMLDivElement>(null);

  // The window can remount a card at any rotation, so seed the handoff once
  // rather than waiting for the next scroll event to correct it.
  useEffect(() => {
    const el = ref.current;
    if (el) el.style.zIndex = u.get() < 0.5 ? String(50 - c) : String(50 + c);
  }, [c, u]);

  /* §4.4 — at u = 0.5 the card crosses the hinge plane and moves from "top of
     the bottom pile" to "top of the top pile". Step it, don't animate it, and
     write the style directly rather than going through React. */
  useMotionValueEvent(u, "change", (v) => {
    const el = ref.current;
    const target = v < 0.5 ? String(50 - c) : String(50 + c);
    if (el && el.style.zIndex !== target) el.style.zIndex = target;

    /* §7.4 — `will-change` on the Motion fallback path only, on exactly the
       cards that are moving, added as the flip starts and removed on settle.
       On the CSS path it is omitted entirely: the browser promotes those
       layers itself, and a manual hint allocates a texture per card. */
    if (!cssPath && el) {
      const want = v > 0.001 && v < 0.999 ? "transform" : "";
      if (el.style.willChange !== want) el.style.willChange = want;
    }
  });

  const photo = photos[c];
  const previous = c > 0 ? photos[c - 1] : undefined;

  const back =
    c === 0 ? (
      <IntroBack album={album} />
    ) : previous ? (
      c === photos.length ? (
        <ColophonBack album={album} photo={previous} chromeCollapsed={chromeCollapsed} />
      ) : (
        <CaptionBack photo={previous} lang={album.lang} revealExtra={chromeCollapsed} />
      )
    ) : null;

  const subject = photo ?? previous;

  return (
    <Card
      elementRef={ref}
      index={c}
      photo={photo}
      back={back}
      u={u}
      cssPath={cssPath}
      axis={axis}
      dark={subject ? appearanceFor(subject.palette.meanL) === "dark" : false}
      total={photos.length}
      priority={c === 0 || c === 1}
    />
  );
}

function LoupeGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11.6 11.6 16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
