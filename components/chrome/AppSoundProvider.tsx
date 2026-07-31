"use client";

import { SoundProvider } from "@web-kits/audio/react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { SOUND_PREF_KEY } from "@/lib/audio";

type SoundSettings = {
  enabled: boolean;
  toggle: () => void;
};

const SoundSettingsContext = createContext<SoundSettings | null>(null);

export function useSoundSettings() {
  const ctx = useContext(SoundSettingsContext);
  if (!ctx) {
    throw new Error("useSoundSettings must be used inside AppSoundProvider");
  }
  return ctx;
}

export function AppSoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Reading localStorage must happen post-mount (unavailable during SSR);
    // this intentionally syncs React state from that one-time read.
    const stored = window.localStorage.getItem(SOUND_PREF_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored !== null) setEnabled(stored === "1");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SOUND_PREF_KEY, enabled ? "1" : "0");
  }, [enabled, hydrated]);

  return (
    <SoundSettingsContext.Provider
      value={{ enabled, toggle: () => setEnabled((v) => !v) }}
    >
      <SoundProvider enabled={enabled}>{children}</SoundProvider>
    </SoundSettingsContext.Provider>
  );
}
