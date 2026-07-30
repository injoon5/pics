"use client";

/**
 * `prefers-reduced-motion`, read in a way that survives hydration.
 *
 * Motion's `useReducedMotion()` reports the real value on the very first
 * client render, while the server has no media queries and rendered the full
 * tree. §13 swaps a whole subtree on this preference, so that discrepancy is a
 * hydration mismatch and React throws the tree away and rebuilds it — which,
 * for a reduced-motion user, means the one visitor most likely to be sensitive
 * to sudden change gets a flash of the animated pad first.
 *
 * So: match the server on the first render, then correct in an effect. One
 * extra render, only for the people who set the preference.
 */

import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return reduced;
}
