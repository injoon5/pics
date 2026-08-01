/**
 * Device-shaped screenshots of the pad at a set of scroll positions.
 *
 * Not a substitute for §0.2 — URL-bar behaviour, 3D rasterisation,
 * backdrop-filter cost and gesture feel only exist on a real iPhone in real
 * Safari, and none of them are visible here. What this *does* catch is the
 * geometry: whether the print lands the right way up, whether the rim shows at
 * 90°, whether the caption sits under its photo, and whether the hinge is
 * where it should be.
 *
 *   node scripts/shoot.mjs http://localhost:3210
 */
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3210";
const out = process.argv[3] ?? "/tmp/shots";
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

const phone = await browser.newContext({
  ...devices["iPhone 13"],
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});

const page = await phone.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

// Listing
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${out}/00-listing.png` });

// Album, at fractions of a flip
await page.goto(`${base}/a/yeoreum-sai`, { waitUntil: "networkidle" });
const vh = await page.evaluate(() => window.innerHeight);

// Mid-flip frames need snapping off: `scroll-snap-type: y mandatory` pulls a
// programmatic scrollTo straight back to the nearest section, so every
// fractional position would otherwise screenshot as a settled one. The snap is
// correct behaviour — it is what stops a hard flick skipping three photos —
// which is exactly why it has to be suspended to photograph the in-between.
await page.addStyleTag({ content: "html { scroll-snap-type: none !important }" });

for (const [name, g] of [
  ["01-intro", 0],
  ["02-quarter", 0.28],
  ["03-half", 0.5],
  ["04-three-quarter", 0.74],
  ["05-landed", 1],
  ["06-second", 2],
  ["07-colophon", 4],
]) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), g * vh);
  await page.waitForTimeout(420);
  await page.screenshot({ path: `${out}/${name}.png` });
}

// Contact sheet
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(200);
await page.getByRole("button", { name: "Browse frames" }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/08-sheet.png` });

// Desktop: book mode + light table
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const dp = await desk.newPage();
dp.on("pageerror", (e) => errors.push(String(e)));
await dp.goto(`${base}/a/midtown-february`, { waitUntil: "networkidle" });
await dp.waitForTimeout(400);
await dp.screenshot({ path: `${out}/09-book.png` });
await dp.evaluate(() => window.scrollTo({ top: window.innerHeight * 0.5, behavior: "instant" }));
await dp.waitForTimeout(400);
await dp.screenshot({ path: `${out}/10-book-mid.png` });
await dp.keyboard.press("g");
await dp.waitForTimeout(500);
await dp.screenshot({ path: `${out}/11-light-table.png` });

// Reduced motion
const rm = await browser.newContext({
  ...devices["iPhone 13"],
  reducedMotion: "reduce",
  isMobile: true,
  hasTouch: true,
});
const rp = await rm.newPage();
rp.on("pageerror", (e) => errors.push(String(e)));
await rp.goto(`${base}/a/yeoreum-sai`, { waitUntil: "networkidle" });
await rp.evaluate(() => window.scrollTo({ top: window.innerHeight * 2, behavior: "instant" }));
await rp.waitForTimeout(500);
await rp.screenshot({ path: `${out}/12-reduced-motion.png` });

await browser.close();

if (errors.length) {
  console.log("PAGE ERRORS:");
  for (const e of [...new Set(errors)]) console.log("  " + e);
} else {
  console.log("no page errors");
}
console.log(`shots → ${out}`);
