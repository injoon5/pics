"use client";

/**
 * The shared-element flights: sleeve → stack (§9) and stack → sheet (§8).
 *
 * Not Motion's `layoutId`, which is what §2.5 reaches for. Two reasons, and
 * both were discovered rather than assumed:
 *
 * 1. Base UI 1.6 makes `Dialog.Portal` mandatory, so the sheet's thumbnails
 *    live in a portal — the exact thing §2.5 warns is "the most likely thing
 *    to break" a shared-layout flight.
 * 2. The sleeve and the pad are different routes. Motion's layout projection
 *    matches elements within one React tree across a commit; an App Router
 *    navigation unmounts the whole tree, so there is nothing to match against.
 *
 * So: a plain FLIP against a detached element. Measure the print where it is,
 * measure where it is going, put a copy at the destination, and animate it
 * from the inverse transform to identity. Only `transform` and `opacity` ever
 * animate (§12), it needs no framework, and it works identically across a
 * route change and across a portal.
 */

import { durations, cssEase } from "@/design/tokens";

type Stash = { src: string; srcSet: string; rect: DOMRect; at: number };

const stashes = new Map<string, Stash>();

/** A gesture may not lead anywhere — a tap that turns into a scroll, a
 *  navigation the user backs out of. An old stash flying in later would be a
 *  ghost, so they expire. */
const MAX_AGE_MS = 1600;

/** Record where a print is *now*, before the thing that moves it happens. */
export function stashPrint(key: string, el: HTMLImageElement | null) {
  if (!el) return;
  stashes.set(key, {
    src: el.currentSrc || el.src,
    srcSet: el.srcset,
    rect: el.getBoundingClientRect(),
    at: performance.now(),
  });
}

export function clearPrint(key: string) {
  stashes.delete(key);
}

/**
 * Fly a stashed print into `target`, then hand off.
 *
 * The destination element is hidden for the duration and revealed on landing,
 * so there is never both a real print and a flying one. Returns false if there
 * was nothing fresh to fly, which is the normal case — a direct visit, a
 * reload, a gesture that went nowhere.
 */
export function flyStashedTo(key: string, target: HTMLElement | null): boolean {
  const stash = stashes.get(key);
  stashes.delete(key);
  if (!stash || !target) return false;
  if (performance.now() - stash.at > MAX_AGE_MS) return false;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  const to = target.getBoundingClientRect();
  if (to.width < 1 || to.height < 1) return false;

  const ghost = document.createElement("img");
  ghost.src = stash.src;
  if (stash.srcSet) ghost.srcset = stash.srcSet;
  ghost.decoding = "sync";
  ghost.ariaHidden = "true";
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
    objectFit: "cover",
    borderRadius: "var(--radius-image)",
    zIndex: "80",
    pointerEvents: "none",
    willChange: "transform",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(ghost);

  // Classic FLIP: the ghost is already at its destination, so the animation
  // runs from the inverse of the delta back to identity. No layout is read or
  // written per frame.
  const dx = stash.rect.left - to.left;
  const dy = stash.rect.top - to.top;
  const sx = stash.rect.width / to.width;
  const sy = stash.rect.height / to.height;

  const previousVisibility = target.style.visibility;
  target.style.visibility = "hidden";

  const animation = ghost.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
      { transform: "translate(0px, 0px) scale(1, 1)" },
    ],
    {
      duration: durations.sheetToggle,
      easing: cssEase.drawer,
      fill: "both",
    },
  );

  const land = () => {
    target.style.visibility = previousVisibility;
    ghost.remove();
  };
  animation.finished.then(land, land);

  return true;
}
