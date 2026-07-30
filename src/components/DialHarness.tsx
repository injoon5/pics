"use client";

import { dialDefaults, useDials } from "@/design/dials";

/**
 * Mounts DialKit panels for every system. Defaults come from tokens.ts.
 * Only rendered in development via DevTools / Flipbook.
 */
export function DialHarness() {
  useDials("Hinge", dialDefaults.Hinge);
  useDials("Card", dialDefaults.Card);
  useDials("Stack", dialDefaults.Stack);
  useDials("Shadow", dialDefaults.Shadow);
  useDials("Sheen", dialDefaults.Sheen);
  useDials("Blur", dialDefaults.Blur);
  useDials("Gesture", dialDefaults.Gesture);
  useDials("Chrome", dialDefaults.Chrome);
  return null;
}
