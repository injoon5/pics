"use client";

import { useEffect, useState } from "react";
import { hinge } from "@/design/tokens";

export type MediaAxis = "x" | "y";

/**
 * `"y"` = book/vertical hinge (rotateY) when fine pointer + min-width book breakpoint.
 * Otherwise `"x"` = stack (rotateX).
 */
export function useMediaAxis(): MediaAxis {
  const [axis, setAxis] = useState<MediaAxis>("x");

  useEffect(() => {
    const query = window.matchMedia(
      `(pointer: fine) and (min-width: ${hinge.bookMinWidth}px)`,
    );
    const sync = () => setAxis(query.matches ? "y" : "x");
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return axis;
}
