"use client";

/**
 * One card of the pad.
 *
 * Two planes: the back, and the front pre-rotated about its own centre. There
 * is no rim and no paper grain — the pad is not pretending to be a physical
 * object made of stock any more, it is a photograph and the text that belongs
 * to it, hinged.
 *
 * The card's transform origin is the hinge edge; the faces' origins are their
 * own centres. Those two must differ, or the print lands upside-down in the
 * top half — which is, incidentally, exactly what happens to a page of a real
 * flip-pad, and exactly why the front face is pre-rotated 180°.
 *
 * Nothing here sets opacity or a filter on `.card` itself: both flatten the 3D
 * context on iOS and collapse the whole pad to a 2D scale (§5.6). Opacity
 * animates on children only.
 */

import { memo, useEffect } from "react";
import {
  motion,
  useMotionTemplate,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { Album, Photo } from "@/fixtures/albums";
import { unlock } from "@/design/sound";
import { restoreSoundPreference, useUi } from "@/lib/store";
import {
  flip as flipTokens,
  shadow as shadowTokens,
  sheen as sheenTokens,
} from "@/design/tokens";
import { easeFlip } from "@/lib/easing";
import { shadowTint } from "@/lib/color";
import { exifLine } from "@/lib/format";
import { sources, fallbackSrc } from "@/lib/image";

export type CardProps = {
  /** Zero-based card index. Card c's front is photo c; its back carries the
   *  caption for photo c−1, or the intro when c is 0 (§1). */
  index: number;
  /** The print on the front. Absent on the final card, which is an empty
   *  sleeve: it holds the last caption and the colophon and never flips. */
  photo?: Photo;
  /** What is printed on the back — intro, caption, or colophon. */
  back: React.ReactNode;
  /** 0 → lying on the unflipped pile, 1 → fully over the hinge. */
  u: MotionValue<number>;
  /** True while the rotation is driven by CSS `animation-timeline: scroll()`;
   *  the Motion transform is then left off this element entirely (§4.1). */
  cssPath: boolean;
  axis: "x" | "y";
  dark: boolean;
  total: number;
  /** Eager for the first card so photo 1 paints before hydration (§11.5). */
  priority?: boolean;
  /** The z-index handoff and the `will-change` toggle write to this element
   *  directly, outside React — see §4.4. */
  elementRef?: React.Ref<HTMLDivElement>;
};

function CardImpl({
  index,
  photo,
  back,
  u,
  cssPath,
  axis,
  dark,
  total,
  priority,
  elementRef,
}: CardProps) {
  const flips = photo !== undefined;

  // §5.4 — both shadows lag the rotation by ~120ms. Real shadows aren't
  // rigidly locked to the object, because the light is diffuse. 120ms is
  // imperceptible as lag and very perceptible as weight.
  const uLag = useSpring(u, { visualDuration: shadowTokens.lagSeconds, bounce: 0 });

  /* The ease has to be applied here too. `easeFlip` was living only inside
     `flipKeyframes()`, so the CSS path was eased and the Motion fallback was
     linear — 54° apart at u = 0.5, which is the difference between a card
     nearly landed and a card standing on edge. Both paths now read the same
     four control points out of `tokens.ts`, which is what makes them
     diffable on device (phase 3). */
  const rotation = useTransform(u, (v) => flipTokens.degrees * easeFlip(v));
  const transform = useMotionTemplate`${
    axis === "y" ? "rotateX" : "rotateY"
  }(${rotation}deg)`;

  // The contact shadow: tight and dark, the card still sitting on the pile.
  // Dead by u = 0.15 — once the paper has broken away there is nothing left
  // for it to touch.
  const contactOpacity = useTransform(uLag, [0, shadowTokens.contact.deadAt], [1, 0]);

  /* Two lighting cues, and between them they are what makes this read as a
     page rather than a rotating rectangle.

     `shade` is the turning page's own surface going dark as it swings toward
     edge-on: a sheet lit from the front reflects almost nothing back at you
     when it is perpendicular. It is strongest around the crossing and gone at
     both ends, which is also exactly when the face is most foreshortened, so
     it costs nothing to read.

     `castOnPile` is the shadow the turning page throws onto the page it is
     landing on. That one is drawn by the stage, not here — a shadow belongs to
     the surface receiving it — but its strength comes from the same value. */
  const shade = useTransform(u, [0, 0.28, 0.5, 0.78, 1], [0, 0.2, 0.3, 0.12, 0]);

  // §5.5 — a light band swept across the face, peaking as the card passes
  // through vertical. Off entirely under reduced motion (see globals.css).
  const sheenOpacity = useTransform(
    u,
    [0.25, 0.5, 0.75],
    [0, sheenTokens.alpha, 0],
  );
  const sheenShift = useTransform(u, [0.2, 0.8], [-140, 140]);
  const sheenTransform = useMotionTemplate`translate3d(${sheenShift}%, 0, 0)`;

  return (
    <motion.div
      ref={elementRef}
      className="card"
      data-flips={flips}
      data-index={index}
      style={{
        // On the CSS path the rotation is entirely the browser's, running on
        // the compositor — writing a Motion transform here as well would
        // fight it. On the fallback path this is a single full transform
        // string, not Motion's shorthand props, which is what keeps it
        // hardware accelerated (§4.1).
        ...(cssPath || !flips ? null : { transform }),
        ["--i" as string]: index,
        // Deliberately no zIndex here: it is stepped imperatively at the
        // hinge crossing, and a React-owned value would stomp it on the next
        // window render (§4.4).
      }}
    >
      {/* Shadow layers sit behind the card and animate transform + opacity
          only. §5.4 asks for blur and offset to grow with the rotation, but
          animating a box-shadow's blur radius is a paint on every frame; a
          pre-built shadow whose element scales and slides reads identically
          and stays on the compositor (§12). */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-card"
        style={{
          opacity: contactOpacity,
          boxShadow: `0 2px ${shadowTokens.contact.blur}px ${shadowTokens.contact.spread}px ${shadowTint(
            photo?.palette.shadowHue ?? 86,
            shadowTokens.contact.alpha,
            dark,
          )}`,
        }}
      />
      {/* ── back: what you read while the card is still on the pile ───────── */}
      <div className="face face--back">
        {back}
        <Shade value={shade} hue={photo?.palette.shadowHue ?? 86} dark={dark} />
      </div>

      {/* ── front: the print ──────────────────────────────────────────────── */}
      {photo && (
        <div className="face face--front">
          <div className="mat">
            <figure className="relative m-0 h-full w-full">
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
                  fetchPriority={priority ? "high" : "auto"}
                  loading={priority ? "eager" : "lazy"}
                />
              </picture>
            </figure>
          </div>


          {/* The band is deliberately twice the card's width so its own edges
              never show — which means it has to be clipped to the card, and
              `.face--front` has no `overflow: hidden` (a clip with a radius
              inside `preserve-3d` breaks backface-visibility on iOS). So the
              clip goes on a wrapper, whose children are flat anyway. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-card"
          >
            <motion.div
              className="sheen absolute -inset-y-1/4 -left-1/2 w-[200%]"
              style={{
                opacity: sheenOpacity,
                transform: sheenTransform,
                background:
                  "linear-gradient(105deg, transparent 30%, oklch(1 0 0 / 0.85) 50%, transparent 70%)",
              }}
            />
          </div>
          <Shade value={shade} hue={photo.palette.shadowHue} dark={dark} />
        </div>
      )}

    </motion.div>
  );
}

/**
 * The surface going dark as it turns away from the light. Opacity only, on a
 * child of the face — never on `.card`, which would flatten the 3D context.
 */
function Shade({
  value,
  hue,
  dark,
}: {
  value: MotionValue<number>;
  hue: number;
  dark: boolean;
}) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: value,
        /* A gradient, not a flat fill: light falls off across a turning page,
           and an even grey rectangle over the photograph reads as a filter
           someone left on. Tinted from the photograph at the same chroma
           ceiling the shadows use. */
        background: `linear-gradient(to bottom, ${shadowTint(
          hue,
          dark ? 0.95 : 1,
          dark,
        )}, ${shadowTint(hue, 0.35, dark)})`,
      }}
    />
  );
}

/** The card re-renders once per settled index at most; memo keeps a sibling's
 *  settle from re-rendering the two cards that didn't change (§0.3). */
export const Card = memo(CardImpl);

/**
 * The EXIF row and the note, printed on the back of the *next* card — so the
 * screen always reads: image on top, its story underneath (§1).
 *
 * This is paper. It swaps when the card rotates away; it never morphs. Putting
 * torph on this line would replace a physical event with a software one at the
 * exact moment the metaphor is doing its work (§2.6).
 */
export function CaptionBack({
  photo,
  lang,
  revealExtra,
}: {
  photo: Photo;
  lang: string;
  revealExtra: boolean;
}) {
  return (
    <div className="bottom-rail flex h-full flex-col gap-3 px-6 pt-8 sm:px-8">
      <CaptionBody photo={photo} lang={lang} revealExtra={revealExtra} />
    </div>
  );
}

/** The caption itself, without the panel that positions it — the colophon card
 *  needs the words but supplies its own layout. */
function CaptionBody({
  photo,
  lang,
  revealExtra,
}: {
  photo: Photo;
  lang: string;
  revealExtra: boolean;
}) {
  return (
    <>
      <p className="exif text-[12px] leading-none">{exifLine(photo.exif)}</p>

      {photo.note && (
        <p className="caption max-w-[38ch] text-[15px]" lang={lang}>
          {photo.note}
        </p>
      )}

      {/* §7.2 — the space Safari's collapsing bar gives back. The second line
          and the location appear as the bar shrinks and collapse away when it
          returns. Grid rows animate cleanly here because this is a settled,
          low-frequency change, not something happening during a flip. */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-[240ms] ease-out"
        style={{
          gridTemplateRows: revealExtra ? "1fr" : "0fr",
          opacity: revealExtra ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          {photo.showLocation && photo.location && (
            <p className="exif text-[12px]" lang={lang}>
              {photo.location.label}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Card 1's back carries the intro. It is the first thing you see (§1).
 *
 * Letterpressed (§5.5): pressed into the paper, not printed on it. Also paper,
 * therefore also never morphed.
 */
export function IntroBack({ album }: { album: Album }) {
  return (
    <div className="bottom-rail flex h-full flex-col gap-4 px-6 pt-10 sm:px-8">
      <h1 className="album-title m-0 text-[26px] text-text-primary" lang={album.lang}>
        {album.title}
      </h1>
      {album.subtitle && (
        <p className="exif m-0 text-[12px]">{album.subtitle}</p>
      )}
      <p className="caption m-0 max-w-[34ch] text-[17px] text-text-primary" lang={album.lang}>
        {album.intro}
      </p>
    </div>
  );
}

/**
 * The empty sleeve at the end. It holds the last caption and the colophon and
 * never flips — there is nothing behind it (§1).
 *
 * The sound toggle lives here and nowhere else: never a settings menu, never a
 * prompt (§7.6). Switching it on is a user gesture, which is exactly when Web
 * Audio is allowed to start, so the unlock happens on the same tap.
 */
export function ColophonBack({
  album,
  photo,
  chromeCollapsed,
}: {
  album: Album;
  photo: Photo;
  chromeCollapsed: boolean;
}) {
  return (
    // Everything on one sheet of paper, so it has to fit on one sheet of
    // paper: this card cannot scroll, and a colophon running off the bottom
    // edge is the one place in the product where the metaphor visibly breaks.
    <div className="bottom-rail flex h-full flex-col gap-3 px-6 pt-6 sm:px-8">
      <CaptionBody photo={photo} lang={album.lang} revealExtra={chromeCollapsed} />
      <hr className="m-0 mt-1 border-0 border-t border-separator" />
      <p className="caption m-0 whitespace-pre-line text-[12px] leading-[1.5]" lang={album.lang}>
        {album.colophon}
      </p>
      <div className="flex items-center justify-between">
        <SoundToggle />
        <span className="exif text-[11px]">That&rsquo;s the roll.</span>
      </div>
    </div>
  );
}

function SoundToggle() {
  const enabled = useUi((s) => s.soundEnabled);
  const setEnabled = useUi((s) => s.setSoundEnabled);

  useEffect(() => restoreSoundPreference(), []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => {
        // Unlock from inside the gesture — Web Audio will not start otherwise,
        // and a deferred unlock is silently ignored (§7.6).
        void unlock();
        setEnabled(!enabled);
      }}
      className="press hit-40 tappable relative flex w-fit items-center gap-2 text-[13px] text-text-secondary"
    >
      <span
        aria-hidden
        className="h-[14px] w-[24px] rounded-full transition-colors duration-[140ms] ease-out"
        style={{
          background: enabled ? "var(--color-accent-fill)" : "var(--color-separator)",
        }}
      >
        <span
          className="block h-[10px] w-[10px] translate-y-[2px] rounded-full bg-surface transition-transform duration-[140ms] ease-out"
          style={{ transform: `translate(${enabled ? 12 : 2}px, 2px)` }}
        />
      </span>
      Sound {enabled ? "on" : "off"}
    </button>
  );
}
