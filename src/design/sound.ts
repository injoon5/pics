"use client";

/**
 * §7.6 — the five sounds.
 *
 * Paper sounds are filtered noise. That is not a metaphor: a page moving
 * through air *is* broadband noise shaped by a moving bandpass, and a print
 * landing on a pile *is* a short lowpassed noise burst. Which is why these are
 * synthesised rather than sampled — a sample is one fixed recording that
 * reveals itself as a loop by the fourth flip, whereas a definition can take
 * the release velocity and open the filter further on a hard flick, the way a
 * real pile does.
 *
 * Authored here, next to `tokens.ts`, so every tunable in the product lives in
 * one folder. (The `usePatch("/patches/flipbook.json")` route is the
 * alternative; don't do both.)
 *
 * Nothing exceeds gain 0.10. Sounds that fire dozens of times a session must
 * sit under the interface, not on top of it.
 */

import { defineSound, ensureReady } from "@web-kits/audio";
import { sound as tokens } from "./tokens";
import { useUi } from "@/lib/store";

/**
 * A card breaking off the pile and landing.
 *
 * Layer one is the sheet rushing through air: the filter envelope sweeping
 * 900 → 3200 Hz *is* the gesture, and the amplitude envelope only gates it. A
 * peak above resting reads as upward movement, which is what the card does.
 *
 * Layer two is the landing, delayed by the time the card actually takes to
 * cross the hinge — 130ms, which is `springs.flipSettle`'s visualDuration less
 * the settle's own tail. Tune it against the animation, never in isolation.
 */
const flip = defineSound({
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

/** Layer two alone: the restack after a sheet select, and the stack sag
 *  springing back at the end of an album. */
const land = defineSound({
  source: { type: "noise", color: "pink" },
  filter: { type: "lowpass", frequency: 1800, resonance: 0.7 },
  envelope: { attack: 0, decay: 0.035, sustain: 0, release: 0.02 },
  gain: 0.07,
});

/** The pile fanning out. Wider and softer than the flip. */
const sheetOpen = defineSound({
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

/**
 * The same definition with the filter peak *below* resting. That inversion is
 * the entire reason open and close read as opposites — a downward swoosh.
 * Reversing the gain instead would just make it quieter, not opposite.
 */
const sheetClose = defineSound({
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

/** The chinagraph circle being drawn, and the frame changing under the loupe.
 *  The faintest thing in the set. */
const mark = defineSound({
  source: { type: "sine", frequency: 1500, fm: { ratio: 0.5, depth: 60 } },
  envelope: { attack: 0, decay: 0.01, sustain: 0, release: 0.004 },
  gain: 0.06,
});

const voices = { flip, land, sheetOpen, sheetClose, mark } as const;
export type Voice = keyof typeof voices;

/* ── gating ─────────────────────────────────────────────────────────────── */

let unlocked = false;
const lastPlayed: Partial<Record<Voice, number>> = {};

/**
 * Web Audio will not start outside a user gesture. Call this from the tap that
 * switches the toggle on, and from the first tap after that.
 *
 * If someone only ever scrolls and never taps, they hear nothing. That is the
 * accepted outcome — engineering around it means either a prompt or an
 * autoplay hack, and §7.6 wants neither.
 */
export async function unlock() {
  if (unlocked) return;
  try {
    await ensureReady();
    unlocked = true;
  } catch {
    // Context creation refused (no gesture, or audio disabled at the OS).
    // Silence is a correct outcome here; do not retry in a loop.
  }
}

/**
 * @param velocity 0–1. Scales gain and dims the filter cutoffs, so a gentle
 *   scroll sounds softer *and* duller than a hard flick. The definitions above
 *   are authored at the hard-flick end, which is why this only ever dims —
 *   it means no gain can exceed its authored value (§7.6, ≤ 0.10).
 */
export function play(voice: Voice, velocity = 1) {
  if (!unlocked) return;
  if (!useUi.getState().soundEnabled) return;

  // Rate limit as a backstop. The real guarantee is that callers fire on
  // settle, not on scroll — a fling across eight cards is one sound.
  const now = performance.now();
  const last = lastPlayed[voice] ?? 0;
  if (now - last < tokens.rateLimitMs) return;
  lastPlayed[voice] = now;

  try {
    voices[voice]({ velocity: clamp(velocity, 0.35, 1) });
  } catch {
    // A voice failing must never take a gesture down with it.
  }
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Maps a release velocity (px/s) onto the 0–1 play velocity. A slow drag lands
 * near the floor; anything past a brisk flick saturates.
 */
export function velocityFromRelease(pxPerSecond: number) {
  const v = Math.abs(pxPerSecond);
  return clamp(0.45 + (v / 2600) * 0.55, 0.45, 1);
}

/** iOS mutes Web Audio output when the hardware ringer switch is off, and the
 *  page cannot override that. Correct behaviour — noted here so nobody spends
 *  an hour debugging it. */
export const ringerSwitchNote =
  "iOS mutes Web Audio when the ringer switch is off. This is not a bug.";
