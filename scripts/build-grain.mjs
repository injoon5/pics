/**
 * The paper-fibre tile (§5.2). One 256×256 seamless WebP, multiplied over the
 * card faces at ~3.5%. Six kilobytes, and the highest-leverage detail in the
 * build — it is the difference between "a light grey rectangle" and "paper".
 *
 * Generated rather than sourced so it is reproducible and license-clean.
 * Deterministic: same seed, same bytes, every run.
 *
 *   node scripts/build-grain.mjs
 */
import sharp from "sharp";
import path from "node:path";

const SIZE = 256;
const OUT = path.resolve("public/grain.webp");

// mulberry32 — the same PRNG the runtime uses for seeded jitter (§5.3), so the
// texture and the layout share a notion of "deterministic".
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value noise on a torus, so every octave tiles. */
function octave(size, cells, seed) {
  const rnd = mulberry32(seed);
  const grid = Array.from({ length: cells * cells }, rnd);
  const at = (x, y) => grid[(y % cells) * cells + (x % cells)];
  const smooth = (t) => t * t * (3 - 2 * t);

  const out = new Float32Array(size * size);
  const scale = cells / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = x * scale;
      const fy = y * scale;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = smooth(fx - x0);
      const ty = smooth(fy - y0);
      const a = at(x0, y0);
      const b = at(x0 + 1, y0);
      const c = at(x0, y0 + 1);
      const d = at(x0 + 1, y0 + 1);
      out[y * size + x] = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    }
  }
  return out;
}

// Fibre, not static: the low octaves are stretched horizontally so the texture
// has a grain direction the way pressed pulp does. Pure isotropic noise reads
// as sensor noise, which is the wrong object entirely.
const fine = octave(SIZE, 128, 0x9e37);
const mid = octave(SIZE, 48, 0x85eb);
const coarse = octave(SIZE, 12, 0xc2b2);

const rnd = mulberry32(0x27d4);
const buf = Buffer.alloc(SIZE * SIZE);

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = y * SIZE + x;
    // Horizontal smear: sample the fine octave a couple of pixels either side
    // and average, which stretches its features along x without breaking the
    // tile (the sampling wraps).
    const smear =
      (fine[y * SIZE + ((x + SIZE - 2) % SIZE)] +
        fine[i] +
        fine[y * SIZE + ((x + 2) % SIZE)]) /
      3;

    let v = 0.5 + (smear - 0.5) * 0.55 + (mid[i] - 0.5) * 0.3 + (coarse[i] - 0.5) * 0.15;

    // Sparse specks — the flecks of darker pulp in uncoated stock.
    if (rnd() < 0.0016) v -= 0.22 * rnd();

    // Land it near white: at 3.5% multiply this must read as texture, never
    // as a grey wash.
    buf[i] = Math.max(0, Math.min(255, Math.round(235 + (v - 0.5) * 78)));
  }
}

const info = await sharp(buf, { raw: { width: SIZE, height: SIZE, channels: 1 } })
  .webp({ quality: 82, effort: 6 })
  .toFile(OUT);

console.log(`grain: ${SIZE}×${SIZE} → public/grain.webp (${info.size} bytes)`);
