"use client";

import { DialRoot } from "dialkit";

// Dev-only live-tuning panel for the flip/stack physics. Only ever mounted
// by the root layout in development (see app/layout.tsx).
export function DialProvider() {
  return <DialRoot position="bottom-left" theme="system" defaultOpen={false} />;
}
