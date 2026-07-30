"use client";

import { useEffect, type RefObject } from "react";

/**
 * Dev-only: walk ancestors of `.stage` and warn if filter / opacity&lt;1 / backdrop-filter
 * would break preserve-3d / fixed descendants.
 */
export function useStageGuard(stageRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const stage = stageRef.current;
    if (!stage) return;

    let el: HTMLElement | null = stage.parentElement;
    while (el && el !== document.documentElement) {
      const style = getComputedStyle(el);
      const filter = style.filter;
      const backdrop =
        style.backdropFilter ||
        (style as CSSStyleDeclaration & { webkitBackdropFilter?: string })
          .webkitBackdropFilter;
      const opacity = Number.parseFloat(style.opacity);

      const badFilter = filter && filter !== "none";
      const badBackdrop = backdrop && backdrop !== "none";
      const badOpacity = Number.isFinite(opacity) && opacity < 1;

      if (badFilter || badBackdrop || badOpacity) {
        console.error(
          "[flipbook] Stage ancestor breaks 3D / fixed stacking:",
          el,
          {
            filter,
            backdropFilter: backdrop,
            opacity,
          },
        );
      }
      el = el.parentElement;
    }
  }, [stageRef]);
}
