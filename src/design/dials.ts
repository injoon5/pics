"use client";

/**
 * §2, §14 — the DialKit harness, and the guarantee that it never ships.
 *
 * In development this is `useDialKit` and you get a live panel. In production
 * `process.env.NODE_ENV` is statically replaced by the bundler, the `require`
 * sits in a provably dead branch, and what survives is a function that
 * flattens the config down to its token defaults. `next.config.ts` additionally
 * aliases `dialkit` to a stub in production builds, so even a regression in
 * dead-code elimination cannot pull it into a client chunk.
 *
 * Verify after any change to this file:
 *   npm run build && grep -rl dialkit .next/static   # expect no matches
 *
 * Note the defaults all come from `tokens.ts`. When a dial is tuned on device,
 * the value gets written back to `tokens.ts` in the same session — DialKit
 * persists to localStorage, which otherwise means a tuned build on your phone
 * and an untuned one on everyone else's (§14).
 */

type Range = [number, number, number] | [number, number, number, number];
type Leaf = number | boolean | string | Range | Record<string, unknown>;
export type DialConfig = Record<string, Leaf>;

type Resolved<T> = {
  [K in keyof T]: T[K] extends Range ? number : T[K];
};

/** The production path: a range becomes its first element, everything else
 *  passes through. No allocation beyond the object itself, and no dependency. */
function flatten<T extends DialConfig>(config: T): Resolved<T> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(config)) {
    const value = config[key];
    out[key] = Array.isArray(value) ? value[0] : value;
  }
  return out as Resolved<T>;
}

type UseDials = <T extends DialConfig>(
  name: string,
  config: T,
  options?: unknown,
) => Resolved<T>;

export const useDials: UseDials =
  process.env.NODE_ENV === "development"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require("dialkit").useDialKit as UseDials)
    : (_name, config) => flatten(config);

export const dialsEnabled = process.env.NODE_ENV === "development";
