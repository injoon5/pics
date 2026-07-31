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

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useVelocity,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { Album } from "@/fixtures/albums";
import { Card, CaptionBack, IntroBack, ColophonBack } from "./Card";
import { FilmCounter } from "./FilmCounter";
import { ProgressiveBlur } from "@/components/chrome/ProgressiveBlur";
import { ContactSheet } from "@/components/sheet/ContactSheet";
import { useStableViewport } from "@/hooks/useStableViewport";
import { useIOSChrome } from "@/hooks/useIOSChrome";
import { useAppearance } from "@/hooks/useAppearance";
import { useWheelNormalise } from "@/hooks/useWheelNormalise";
import { useHingeDrag } from "@/hooks/useHingeDrag";
import { usePadGestures } from "@/hooks/usePadGestures";
import { play, unlock, velocityFromRelease } from "@/design/sound";
import { useUi } from "@/lib/store";
import { warmDecode } from "@/lib/image";
import { flyStashedTo, stashPrint } from "@/lib/flight";
import { clamp } from "@/lib/gesture";
import { appearanceFor } from "@/lib/color";
import { easeFlip } from "@/lib/easing";
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

  const [axis, setAxis] = useState<"x" | "y">("y");
  const [cssPath, setCssPath] = useState(false);
  const [index, setIndex] = useState(0);

  const p = useDials("Hinge", {
    ratio: [hingeTokens.ratio, 0.25, 0.75],
    topBlur: [blur.topExtent, 0, 0.6],
    bottomBlur: [blur.bottomExtent, 0, 0.6],
  });

  const chrome = useIOSChrome();
  // The dial has to reach the hinge itself, not just the blur bands.
  useStableViewport(p.ratio);

  /* The blur band heights are published as CSS so they follow `--pane-h`,
     which `useStableViewport` re-freezes on rotation. Computing them in JS
     from `window.innerHeight` meant reading a ref during render — zero on the
     first paint, and stale after a rotation until something else happened to
     re-render. `--blur-bottom` additionally keeps `.bottom-rail` clear of its
     own band, so the caption's last line is never blurred. */
  useEffect(() => {
    const root = document.documentElement.style;
    /* Never shorter than the iOS status bar. The top band's job is partly to
       be the thing the status bar sits on — `black-translucent` runs the page
       under it — and a band that stops short of the safe-area inset leaves the
       clock over bare photograph. */
    root.setProperty(
      "--blur-top",
      `max(calc(var(--hinge-y) * ${p.topBlur}), calc(env(safe-area-inset-top) + 32px))`,
    );
    root.setProperty("--blur-bottom", `calc(var(--pane-h) * ${p.bottomBlur})`);
  }, [p.topBlur, p.bottomBlur]);

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

  /* This one is deliberately NOT frozen, and it is the opposite of §7.1's
     hinge. The sections are `100dvh`, and `100dvh` *is* `window.innerHeight`
     at any given moment — so the section boundaries move as Safari's URL bar
     collapses. If `g` divided by a height frozen at mount, the two would
     diverge and the error would compound with every card: 60px of collapsed
     chrome on a 734px viewport puts snap point 12 at g = 12.98, which is the
     wrong card, the wrong caption, and a mount window that no longer contains
     the print lying face-up.

     So: the hinge is frozen (it must never move), and this is live (it must
     always match the sections). Both are §7.1. */
  const viewport = useRef(1);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      viewport.current = window.innerHeight || 1;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useMotionValueEvent(scrollY, "change", (y) => {
    g.set(clamp(y / viewport.current, 0, cards - 1));
  });

  /* Seed from the current scroll before first paint. Motion schedules its
     first scroll measurement on the next frame, so a reload or a back
     navigation that restores scroll would otherwise show the pad fully
     unflipped for a frame or two and then jump. */
  useLayoutEffect(() => {
    viewport.current = window.innerHeight || 1;
    g.set(clamp(window.scrollY / viewport.current, 0, cards - 1));
    const seeded = Math.round(g.get());
    settled.current = seeded;
    lastSounded.current = seeded;
    setIndex(seeded);
  }, [g, cards]);

  /* `index` is the semantic position — how many flips have landed — and it is
     what the caption, the counter, the appearance and the theme colour read.
     `Math.round` is right for that: the appearance should change when the new
     print has visually taken the top pane, not when the last pixel of the old
     one leaves.

     It is NOT the right centre for the mount window. See `window4` below. */
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

  /* §9 — the sleeve empties into the hinge. The print the sleeve was showing
     flies into the pile, which is where a wallet's prints go. Runs once, on
     mount, and is a no-op on a direct visit or a reload. */
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    flyStashedTo(`album:${album.slug}`, stage.current);
  }, [album.slug]);

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

      /* Space on the sound toggle, or on a contact-sheet frame, must activate
         the control — not get preventDefault()ed into a page flip. And while
         the sheet is open the pad is not what the arrow keys are steering. */
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          /^(BUTTON|INPUT|TEXTAREA|SELECT|A)$/.test(target.tagName))
      ) {
        if (e.key !== "Escape") return;
      }
      if (sheetOpen && e.key !== "Escape" && e.key !== "g" && e.key !== "G") return;

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
    if (onBrowse) return onBrowse();
    // §8 — the same print flies to its grid cell. Measured before the sheet
    // mounts, because after that the pad is behind a modal.
    stashPrint(
      "sheet",
      document.querySelector<HTMLImageElement>(".card[data-flips=true] .mat img"),
    );
    setSheetOpen(true);
  }, [onBrowse, setSheetOpen]);

  /* And back: the sheet stashes the cell it is leaving from, and the pad
     catches it. Deferred a frame so the stage has laid out first. */
  useEffect(() => {
    if (sheetOpen) return;
    const frame = requestAnimationFrame(() => {
      flyStashedTo(
        "sheet-return",
        document.querySelector<HTMLElement>(".card[data-flips=true] .mat"),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [sheetOpen, index]);

  const hingeDrag = useHingeDrag(openBrowse);
  const padGestures = usePadGestures(openBrowse);

  /* The cards that can be on screen are `floor(g)−1` (lying face-up above the
     hinge), `floor(g)` (flipping) and `floor(g)+1` (the next back). With
     `index = round(g)`, `floor(g)` is either `index−1` or `index`, so the
     union of what might be visible is `index−2 … index+1`.

     §12 budgets three mounted cards, and three is what a window centred on the
     *flipping* card would need. This one is centred on the semantic index, so
     it needs four — the alternative is a second piece of state tracking
     `floor(g)`, which changes at integers where `index` changes at halves, and
     that costs two renders per card instead of one.

     Getting this wrong is not subtle: with a three-card window, every flip
     unmounts the previous print exactly halfway through, and on the Motion
     path — where the incoming card is edge-on at u = 0.5 — the entire top half
     of the screen goes to bare paper. */
  const window4 = useMemo(
    () =>
      [index - 2, index - 1, index, index + 1].filter((c) => c >= 0 && c < cards),
    [index, cards],
  );

  const remaining = cards - index;

  return (
    <>
      {/* The gesture surface for pinch-to-open and the end-of-album sag (§8,
          §3.4). `touch-action: pan-y` is what lets it sit over the whole pad
          without taking the scroll away: the browser keeps the vertical pan,
          and we still see every pointer. Below the grabber and the sheet in
          the stacking order, so neither loses its own events. */}
      <div
        aria-hidden
        className="fixed inset-0 z-10 touch-pan-y"
        {...padGestures}
      />

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
      <div
        ref={stage}
        className="stage"
        data-axis={axis}
        data-path={cssPath ? "css" : "motion"}
      >

        {/* The turning page's shadow, falling on the flipped pile beneath it.
            A gradient anchored at the hinge and reaching up the top pane,
            strongest as the page passes over — this is the cue that says one
            sheet is above another rather than two rectangles sharing a plane.
            Opacity only, and it sits under every card. */}
        <PageShadow g={g} index={index} axis={axis} />

        {window4.map((c) => (
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

      </div>

      {/* Siblings of the stage, never children (§5.6). */}
      {current && (
        <>
          <ProgressiveBlur
            edge="top"
            band={current.palette.topBand}
            thumbhash={current.thumbhash}
            height="var(--blur-top)"
          />
          <ProgressiveBlur
            edge="bottom"
            band={current.palette.bottomBand}
            thumbhash={current.thumbhash}
            height="var(--blur-bottom)"
          />
        </>
      )}

      {/* The counter sits with the caption, aligned to its measure, rather
          than pinned to the window edge — on a wide screen the edge is a long
          way from anything it relates to. */}
      <div
        className="fixed z-40"
        style={
          axis === "y"
            ? { top: "calc(var(--hinge-y) + 16px)", right: 24 }
            : { top: 24, left: "calc(var(--hinge-x) + 24px)" }
        }
      >
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
  /* The card crosses the hinge plane when it passes vertical — which, on the
     eased curve, is u ≈ 0.317, not 0.5. Stepping at 0.5 left the incoming
     print drawn *behind* the one it is landing on for 18% of every flip. */
  const crossed = (v: number) => easeFlip(v) >= 0.5;

  useEffect(() => {
    const el = ref.current;
    if (el) el.style.zIndex = crossed(u.get()) ? String(50 + c) : String(50 - c);
  }, [c, u]);

  /* §4.4 — at u = 0.5 the card crosses the hinge plane and moves from "top of
     the bottom pile" to "top of the top pile". Step it, don't animate it, and
     write the style directly rather than going through React. */
  useMotionValueEvent(u, "change", (v) => {
    const el = ref.current;
    const target = crossed(v) ? String(50 + c) : String(50 - c);
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

function PageShadow({
  g,
  index,
  axis,
}: {
  g: MotionValue<number>;
  index: number;
  axis: "x" | "y";
}) {
  // Only the card actually turning throws this, and only while it is turning.
  const u = useTransform(g, (v) => clamp(v - Math.floor(v), 0, 1));
  const opacity = useTransform(u, [0, 0.2, 0.55, 0.9, 1], [0, 0.5, 0.72, 0.24, 0]);
  const reach = useTransform(u, [0, 0.5, 1], [26, 82, 40]);
  const shadow = useMotionTemplate`linear-gradient(to top, oklch(0 0 0 / 0.5), transparent ${reach}%)`;

  if (index < 1) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        opacity,
        backgroundImage: shadow,
        zIndex: 40,
        ...(axis === "y"
          ? {
              left: 0,
              right: 0,
              top: "calc(var(--hinge-y) - var(--pane-h) + var(--stack-peek))",
              height: "calc(var(--pane-h) - var(--stack-peek))",
            }
          : {
              top: 0,
              bottom: 0,
              left: "calc(var(--hinge-x) - var(--pane-w) + var(--stack-peek))",
              width: "calc(var(--pane-w) - var(--stack-peek))",
            }),
      }}
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
