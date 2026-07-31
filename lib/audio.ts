import type { SoundDefinition } from "@web-kits/audio";

// Paper edge catching air as a card crosses the midpoint of its flip.
export const flipSound: SoundDefinition = {
  source: { type: "noise", color: "white" },
  filter: {
    type: "bandpass",
    frequency: 1100,
    resonance: 1.1,
    envelope: { peak: 3400, decay: 0.16 },
  },
  envelope: { attack: 0.004, decay: 0.14, sustain: 0, release: 0.06 },
  gain: 0.16,
};

// Soft tap for chrome: view toggle, grid selection, nav.
export const tapSound: SoundDefinition = {
  source: { type: "sine", frequency: { start: 1400, end: 520 } },
  envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.02 },
  gain: 0.2,
};

// Subtle swell when entering an album.
export const enterSound: SoundDefinition = {
  layers: [
    {
      source: { type: "sine", frequency: { start: 220, end: 330 } },
      envelope: { attack: 0.06, decay: 0.35, sustain: 0.05, release: 0.35 },
      gain: 0.12,
    },
    {
      source: { type: "triangle", frequency: { start: 440, end: 660 } },
      envelope: { attack: 0.08, decay: 0.3, sustain: 0, release: 0.3 },
      gain: 0.05,
    },
  ],
  effects: [{ type: "reverb", decay: 1.1, mix: 0.3 }],
};

export const SOUND_PREF_KEY = "pics:sound-enabled";
