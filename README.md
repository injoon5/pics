# Flipbook

A photo site built around one physical metaphor: a flip-top pad of prints.
Mobile-first, iOS Safari as the primary target, macOS as the second.

The viewport splits at the **hinge**. Below it is the unflipped pile, backs up —
you are looking at the back of card *n+1*. Above it is the flipped pile, faces
up — you are looking at photo *n*. The back of card *n+1* carries the caption
for photo *n*, so the screen always reads: image on top, its story underneath.
Scrolling rotates the top card of the bottom pile up and over. It is a pure
function of scroll position.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run dev:lan      # serve over LAN, for testing on a real phone
```

`predev` and `prebuild` self-host the Interlude subsets into `public/fonts/`
(gitignored — 15MB of woff2 that has no business in the repository).

| Script | What it does |
| --- | --- |
| `npm run fixtures` | Re-derives `src/fixtures/photos.ts` and the srcset variants from `public/photos/*.jpeg` — EXIF, band means, mean lightness, thumbhashes |
| `npm run grain` | Regenerates the tiling paper-fibre texture |
| `npm run contrast` | Measures every §3.1 foreground/background pair in **both** appearances |
| `npm run shots` | Device-shaped screenshots of the pad at a set of scroll positions |

`npm run contrast` is not decorative. The palettes are not mirror images of one
another, so a token change that reads fine in light can fail in dark. Run it
after touching `globals.css`.

## Where things live

```
src/design/tokens.ts     every tunable number; DialKit reads its defaults here
src/design/sound.ts      the five synthesised voices
src/design/dials.ts      the dev-only DialKit shim
src/app/globals.css      the OKLCH @theme, the 3D geometry, the paper
src/components/stage/    the pad — hinge engine, card, stack, counter
src/components/sheet/    the contact sheet, sprockets, chinagraph mark, loupe
src/components/sleeve/   the album listing
src/components/desktop/  the light table
src/lib/gesture.ts       projection, rubber-banding, velocity
src/fixtures/            photos.ts is generated; albums.ts is authored
```

Nothing in `src/` should inline a number that belongs in `tokens.ts`. If you
tune a value through DialKit on a device, write it back into `tokens.ts` in the
same session — DialKit persists to localStorage, which otherwise means a tuned
build on your phone and an untuned one on everyone else's.

## Two hazards worth knowing before you edit

**Tailwind's utilities layer wins.** Custom classes declared in
`@layer utilities` sit after Tailwind's own, so a `position` or `padding` there
beats `fixed` or `pb-6` on the same element. This has bitten twice in this
build: once silently disabling the iOS chrome tracking, once dropping the
browse button out of the fixed layer entirely.

**Nothing above `.stage` may flatten it.** `opacity < 1`, `filter`,
`backdrop-filter`, `mask`, `overflow: hidden` with a radius, or `will-change` on
anything but `transform`, on any ancestor, collapses the 3D context on iOS and
the whole pad becomes a 2D scale. It mostly still works on desktop, which is why
it is so easy to ship by accident. There is a dev-only assertion in
`components/dev/StageAssert.tsx` that walks up from `.stage` and shouts.

## What is and isn't built

Phases 0–7 and 9 are in, against the six photographs already in this
repository. Their EXIF, band means and thumbhashes are measured from the files,
not invented, so the analysis pipeline is the real one — only its data source is
a fixture.

**Not built:**

- **Phase 8** — Convex, R2, and the studio. Out of scope for this pass. The
  fixture types mirror the §11.1 schema exactly, so swapping the import is the
  whole migration.
- **Image variants** are generated at fixture-build time, which is §11.4's
  recorded fallback. The preferred path is Cloudflare image transformations on
  the R2 custom domain; `sources()` in `src/lib/image.ts` is the one seam that
  changes.
- **`project()` on the pad.** `scroll-snap-stop: always` makes the browser the
  snapper there and forbids advancing more than one card per fling, so §3.4's
  projection and §4.2's snap-stop are in direct conflict. The build takes §4.2
  — skipping three photos on a hard flick is the worse failure — and uses the
  projection on the hinge drag, which is the one threshold the app decides
  itself.

The shared-element flights are **not** Motion `layoutId`, which is what §2.5
reaches for. Base UI 1.6 makes `Dialog.Portal` mandatory, so the sheet's
thumbnails live in exactly the portal §2.5 warns will break a shared-layout
flight; and the sleeve and the pad are different routes, so there is no single
commit for layout projection to match across. `src/lib/flight.ts` does a plain
FLIP against a detached element instead: only `transform` animates, it needs no
framework, and it behaves identically across a route change and across a
portal.

**And the caveat that matters most:** none of this has been on a real iPhone.
URL-bar behaviour, 3D rasterisation, `backdrop-filter` cost and gesture feel
only exist on device, and the values in `tokens.ts` are untuned defaults chosen
by reading rather than by feel. Serve over LAN, open Safari remote devtools, and
expect to move numbers.
