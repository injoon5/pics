"use client";

/**
 * §2.5 — one small store, UI booleans only.
 *
 * It must never hold a scroll position, a MotionValue, or anything that
 * changes per frame. If you are tempted to put the flip progress in here,
 * that is §0.3 being violated: React re-renders exactly once per settled
 * photo index, and a store subscription is a re-render.
 */

import { create } from "zustand";

type UiState = {
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;

  /** §7.6 — off by default, never a prompt. Persisted to localStorage. */
  soundEnabled: boolean;
  setSoundEnabled: (on: boolean) => void;

  /** The one index React is allowed to know about, written on settle. */
  lastSettledIndex: number;
  setLastSettledIndex: (i: number) => void;
};

const SOUND_KEY = "flipbook:sound";

export const useUi = create<UiState>((set) => ({
  sheetOpen: false,
  setSheetOpen: (sheetOpen) => set({ sheetOpen }),

  soundEnabled: false,
  setSoundEnabled: (soundEnabled) => {
    try {
      localStorage.setItem(SOUND_KEY, soundEnabled ? "1" : "0");
    } catch {
      // Private mode, or storage disabled. The toggle still works for the
      // session; it just won't be remembered. Not worth surfacing.
    }
    set({ soundEnabled });
  },

  lastSettledIndex: 0,
  setLastSettledIndex: (lastSettledIndex) => set({ lastSettledIndex }),
}));

/** Read the persisted preference once on mount, client-side only — reading
 *  localStorage during render would desync hydration. */
export function restoreSoundPreference() {
  try {
    if (localStorage.getItem(SOUND_KEY) === "1") {
      useUi.setState({ soundEnabled: true });
    }
  } catch {
    /* see above */
  }
}
