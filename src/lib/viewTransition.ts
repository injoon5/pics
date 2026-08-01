"use client";

/**
 * Page transitions, via the native View Transitions API.
 *
 * Not React's `<ViewTransition>` and not Next's `experimental.viewTransition`:
 * both need a React experimental build, and swapping React channels for one
 * animation is not a trade worth making. `document.startViewTransition` is in
 * Safari 18+ and Chrome 111+, which is the whole target, and it degrades to a
 * plain navigation everywhere else.
 *
 * The awkward part is that App Router navigation is asynchronous — the DOM
 * changes when the route's payload has streamed in, not when `push()` returns
 * — while `startViewTransition` wants a callback that mutates the DOM and
 * resolves. So the two halves shake hands: the caller starts the transition and
 * parks a resolver here, and the destination page calls `finishRouteTransition`
 * once it has mounted.
 *
 * Every path out of here is guarded. If the destination never signals — a
 * bailed navigation, a route that throws, a prefetch that missed — a timeout
 * releases the transition rather than leaving the page frozen under a snapshot,
 * which is the one genuinely bad failure this API has.
 */

const SETTLE_TIMEOUT_MS = 900;

type Resolver = (() => void) | null;
let pending: Resolver = null;
let timer: ReturnType<typeof setTimeout> | undefined;

type StartViewTransition = (callback: () => void | Promise<void>) => {
  finished: Promise<void>;
};

function api(): StartViewTransition | null {
  if (typeof document === "undefined") return null;
  const fn = (document as Document & { startViewTransition?: StartViewTransition })
    .startViewTransition;
  if (typeof fn !== "function") return null;
  // Reduced motion gets the navigation without the animation. The transition
  // still *happens*, it just has nothing to animate (see globals.css), but
  // skipping it entirely also skips the freeze, which is kinder.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  return fn.bind(document);
}

export const supportsViewTransitions = () => api() !== null;

/**
 * Run a route change as a page transition.
 *
 * @param navigate must actually start the navigation; it is called inside the
 *   transition callback, so the browser has already taken its "before"
 *   snapshot by the time it runs.
 */
export function routeTransition(navigate: () => void, direction: "in" | "out") {
  const start = api();
  if (!start) {
    navigate();
    return;
  }

  document.documentElement.dataset.navDirection = direction;

  start(
    () =>
      new Promise<void>((resolve) => {
        release();
        pending = resolve;
        timer = setTimeout(release, SETTLE_TIMEOUT_MS);
        navigate();
      }),
  ).finished.finally(() => {
    delete document.documentElement.dataset.navDirection;
  });
}

/** Called by the destination once it has mounted. Safe to call when nothing
 *  is pending, which is the common case — a direct visit or a reload. */
export function finishRouteTransition() {
  release();
}

function release() {
  clearTimeout(timer);
  timer = undefined;
  const resolve = pending;
  pending = null;
  resolve?.();
}
