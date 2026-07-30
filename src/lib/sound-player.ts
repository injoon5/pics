"use client";

import { ensureReady } from "@web-kits/audio";
import {
  flipSound,
  landSound,
  markSound,
  sheetCloseSound,
  sheetOpenSound,
} from "@/design/sound";
import { sound as soundTokens } from "@/design/tokens";
import { useUiStore } from "@/store/ui";

let lastPlay = 0;
let unlocked = false;

async function unlock() {
  if (unlocked) return;
  await ensureReady();
  unlocked = true;
}

function rateOk() {
  const now = performance.now();
  if (now - lastPlay < soundTokens.rateLimitMs) return false;
  lastPlay = now;
  return true;
}

export async function playFlip(velocity = 0) {
  const enabled = useUiStore.getState().soundEnabled;
  if (!enabled || !rateOk()) return;
  await unlock();
  const intensity = Math.min(1, Math.abs(velocity) / 2000);
  void intensity;
  flipSound();
}

export async function playLand() {
  if (!useUiStore.getState().soundEnabled || !rateOk()) return;
  await unlock();
  landSound();
}

export async function playSheetOpen() {
  if (!useUiStore.getState().soundEnabled || !rateOk()) return;
  await unlock();
  sheetOpenSound();
}

export async function playSheetClose() {
  if (!useUiStore.getState().soundEnabled || !rateOk()) return;
  await unlock();
  sheetCloseSound();
}

export async function playMark() {
  if (!useUiStore.getState().soundEnabled || !rateOk()) return;
  await unlock();
  markSound();
}
