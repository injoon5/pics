"use client";

import { useEffect, useState } from "react";
import { chrome, hinge } from "@/design/tokens";

export interface IOSChromeState {
  /** Last known inset; prefer CSS `--chrome-inset` during scroll (§0.3). */
  chromeInset: number;
  stableHeight: number;
  collapsed: boolean;
}

/** Midpoint between expanded/collapsed Safari bar heights. */
const COLLAPSED_INSET_PX =
  (chrome.safariBarExpandedPt + chrome.safariBarCollapsedPt) / 2;

/**
 * Stable hinge height from window.innerHeight; chrome inset from visualViewport.
 * Inset is written to `--chrome-inset` every frame — React state only when
 * `collapsed` flips (§0.3 / §7.1–7.2).
 */
export function useIOSChrome(hingeRatio: number = hinge.ratio): IOSChromeState {
  const [stableHeight, setStableHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 0,
  );
  const [collapsed, setCollapsed] = useState(false);
  const [chromeInset, setChromeInset] = useState(0);

  useEffect(() => {
    const root = document.documentElement;

    const measureStable = () => {
      const h = window.innerHeight;
      setStableHeight(h);
      root.style.setProperty("--hinge-y", `${h * hingeRatio}px`);
    };

    measureStable();
    window.addEventListener("orientationchange", measureStable);

    let raf = 0;
    let lastCollapsed: boolean | null = null;
    let lastInset = -1;

    const measureChrome = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const inset = vv
          ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
          : 0;

        // Direct style write — no React during URL-bar / floating tab motion
        if (inset !== lastInset) {
          lastInset = inset;
          root.style.setProperty("--chrome-inset", `${inset}px`);
        }

        const nextCollapsed = inset < COLLAPSED_INSET_PX;
        if (lastCollapsed === null || nextCollapsed !== lastCollapsed) {
          lastCollapsed = nextCollapsed;
          root.dataset.chrome = nextCollapsed ? "collapsed" : "expanded";
          setCollapsed(nextCollapsed);
          setChromeInset(inset);
        }
      });
    };

    measureChrome();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", measureChrome);
    vv?.addEventListener("scroll", measureChrome);
    window.addEventListener("resize", measureChrome);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("orientationchange", measureStable);
      window.removeEventListener("resize", measureChrome);
      vv?.removeEventListener("resize", measureChrome);
      vv?.removeEventListener("scroll", measureChrome);
    };
  }, [hingeRatio]);

  return {
    chromeInset,
    stableHeight,
    collapsed,
  };
}
