import { create } from "zustand";

/** UI-only booleans. Never holds scroll position or MotionValues. */
interface UiState {
  sheetOpen: boolean;
  soundEnabled: boolean;
  lastSettledIndex: number;
  setSheetOpen: (open: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setLastSettledIndex: (index: number) => void;
}

function readSoundFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("flipbook:sound") === "1";
  } catch {
    return false;
  }
}

export const useUiStore = create<UiState>((set) => ({
  sheetOpen: false,
  soundEnabled: false,
  lastSettledIndex: 0,
  setSheetOpen: (sheetOpen) => set({ sheetOpen }),
  setSoundEnabled: (soundEnabled) => {
    try {
      window.localStorage.setItem("flipbook:sound", soundEnabled ? "1" : "0");
    } catch {
      /* ignore */
    }
    set({ soundEnabled });
  },
  setLastSettledIndex: (lastSettledIndex) => set({ lastSettledIndex }),
}));

export function hydrateSoundFromStorage() {
  useUiStore.setState({ soundEnabled: readSoundFlag() });
}
