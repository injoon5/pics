"use client";

import { useEffect, useState } from "react";
import { chrome, hinge } from "@/design/tokens";

export interface IOSChromeState {
  chromeInset: number;
  stableHeight: number;
  collapsed: boolean;
}

/** Midpoint between expanded/collapsed Safari bar heights. */
const COLLAPSED_INSET_PX =
  (chrome.safariBarExpandedPt + chrome.safariBarCollapsedPt) / 2;

/**
 * Stable hinge height from window.innerHeight; chrome inset from visualViewport.
 */
export function useIOSChrome(hingeRatio: number = hinge.ratio): IOSChromeState {
  const [chromeInset, setChromeInset] = useState(0);
  const [stableHeight, setStableHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 0,
  );

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
    const measureChrome = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        if (!vv) {
          setChromeInset(0);
          root.style.setProperty("--chrome-inset", "0px");
          return;
        }
        const inset = window.innerHeight - vv.height - vv.offsetTop;
        const clamped = Math.max(0, inset);
        setChromeInset(clamped);
        root.style.setProperty("--chrome-inset", `${clamped}px`);
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
    collapsed: chromeInset < COLLAPSED_INSET_PX,
  };
}
