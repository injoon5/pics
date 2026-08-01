/**
 * Deterministic per-photo jitter (§5.3).
 *
 * A machine-perfect stack looks fake. Random jitter that changes on reload
 * reads as noise rather than as an object — you notice the print moved and it
 * stops being a print. So: seeded from the photo id, which means the same
 * frame sits at the same angle in the stack, in the contact sheet, and in the
 * sleeve. That consistency is the whole point (§16, "Craft").
 */

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Jitter = {
  /** ±0.4px */
  dx: number;
  /** ±0.35deg */
  dr: number;
  /** 0–1, for anything else that wants a stable per-photo random. */
  n: number;
};

const cache = new Map<string, Jitter>();

/** The same seed drives the stack, the contact sheet and the sleeve. */
export function jitter(id: string, jx = 0.8, jr = 0.7): Jitter {
  const key = `${id}:${jx}:${jr}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const j = mulberry32(hash(id));
  const value: Jitter = {
    dx: (j() - 0.5) * jx,
    dr: (j() - 0.5) * jr,
    n: j(),
  };
  cache.set(key, value);
  return value;
}

/** A stable stream for anything needing more than three numbers (the
 *  chinagraph path, the light-table scatter). */
export function seeded(id: string): () => number {
  return mulberry32(hash(id));
}
