import { defineSound } from "@web-kits/audio";

/** Paper sounds — synthesised filtered noise. Off by default; unlock from a gesture. */

export const flipSound = defineSound({
  layers: [
    {
      source: { type: "noise", color: "white" },
      filter: {
        type: "bandpass",
        frequency: 900,
        resonance: 1.4,
        envelope: { attack: 0.02, peak: 3200, decay: 0.1 },
      },
      envelope: { attack: 0.015, decay: 0.11, sustain: 0, release: 0.04 },
      gain: 0.07,
    },
    {
      source: { type: "noise", color: "pink" },
      filter: { type: "lowpass", frequency: 1800, resonance: 0.7 },
      envelope: { attack: 0, decay: 0.035, sustain: 0, release: 0.02 },
      gain: 0.1,
      delay: 0.13,
    },
  ],
});

export const landSound = defineSound({
  source: { type: "noise", color: "pink" },
  filter: { type: "lowpass", frequency: 1800, resonance: 0.7 },
  envelope: { attack: 0, decay: 0.035, sustain: 0, release: 0.02 },
  gain: 0.07,
});

export const sheetOpenSound = defineSound({
  source: { type: "noise", color: "pink" },
  filter: {
    type: "bandpass",
    frequency: 600,
    resonance: 1.1,
    envelope: { attack: 0.03, peak: 2600, decay: 0.16 },
  },
  envelope: { attack: 0.03, decay: 0.18, sustain: 0, release: 0.06 },
  gain: 0.06,
});

export const sheetCloseSound = defineSound({
  source: { type: "noise", color: "pink" },
  filter: {
    type: "bandpass",
    frequency: 600,
    resonance: 1.1,
    envelope: { attack: 0.03, peak: 260, decay: 0.16 },
  },
  envelope: { attack: 0.03, decay: 0.18, sustain: 0, release: 0.06 },
  gain: 0.06,
});

export const markSound = defineSound({
  source: {
    type: "sine",
    frequency: 1500,
    fm: { ratio: 0.5, depth: 60 },
  },
  envelope: { attack: 0, decay: 0.01, sustain: 0, release: 0.004 },
  gain: 0.06,
});
