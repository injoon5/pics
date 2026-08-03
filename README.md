# Flipbook

A photo site built around one physical metaphor: a flip-top pad of prints.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4 (OKLCH `@theme`)
- Motion + CSS scroll-driven animation
- Interlude (variable type)
- DialKit (dev only)
- Base UI, NumberFlow, torph, `@web-kits/audio`

## Develop

```bash
npm install
npm run dev
```

Open `/` for the sleeve drawer, `/album/east-coast-roll` for the flip.

Fixtures live in `public/fixtures` and `src/fixtures/photos.ts`.

Convex / R2 / studio upload land in a later phase — `/studio` is a placeholder.

## Agent harness

Screenshots + video (+ optional audio) for local/cloud agents:

```bash
npm run harness -- screenshots
npm run harness -- video --audio
```

See [`harness/README.md`](./harness/README.md).

## DialKit

Dev-only. Mounted via `DevTools`. Tune values, then write them back to `src/design/tokens.ts`.
