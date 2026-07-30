"use client";

/**
 * §14 — the DialKit harness, mounted only in development.
 *
 * `<DialRoot />` and the stage assertion both come in through a dynamic import
 * with `ssr: false`, inside a component that is itself only rendered when
 * `dialsEnabled`. Combined with the production resolve alias in
 * `next.config.ts`, there is no path by which `dialkit` reaches a client
 * chunk — verify with `npm run build && grep -rl dialkit .next/static`.
 */

import dynamic from "next/dynamic";
import { dialsEnabled } from "@/design/dials";

const DialRoot = dynamic(
  () => (dialsEnabled ? import("dialkit").then((m) => m.DialRoot) : Promise.resolve(() => null)),
  { ssr: false },
);

const StageAssert = dynamic(
  () => import("./StageAssert").then((m) => m.StageAssert),
  { ssr: false },
);

export function DevHarness() {
  if (!dialsEnabled) return null;
  return (
    <>
      <StageAssert />
      <DialRoot />
    </>
  );
}
