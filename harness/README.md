# Agent harness

Local Playwright harness for Flipbook — screenshots, video, optional audio.

Agents should use this instead of one-off browser scripts.

## Commands

```bash
# Screenshots (mobile + desktop viewports)
npm run harness -- screenshots

# Video only (mobile, no audio)
npm run harness -- video

# Video + Web Audio tap muxed via ffmpeg → mp4
npm run harness -- video --audio

# Everything
npm run harness -- all --audio

# Reuse a server that’s already up
npm run harness -- screenshots --url http://127.0.0.1:3000

# Headed / slow-mo (debug)
npm run harness -- video --headed --slowmo 80
```

## Output

```
artifacts/harness/<iso-stamp>/
  screens/*.png
  video/flipbook-<stamp>.webm   # or .mp4 when --audio
  video/audio-<stamp>.webm      # tapped Web Audio (if --audio)
  manifest.json
artifacts/harness/latest.json   # pointer for agents
```

Also mirrors into `/opt/cursor/artifacts/harness/` when that path exists (cloud agents).

## Selectors

Stable markers for automation:

| Marker | Where |
| --- | --- |
| `[data-harness="sleeve-drawer"]` | Album listing |
| `[data-harness="flipbook"]` | Album stage root |
| `[data-harness="scroller"]` | Snap scroll container |
| `[data-harness="contact-sheet"]` | Contact sheet popup |
| `getByRole('button', { name: /open contact sheet/i })` | Hinge grabber |
| `[data-photo-index="N"]` | Sheet frame cell |
| `getByLabel('Sound')` | Colophon sound toggle |

## Audio notes

Playwright’s `recordVideo` does **not** capture Web Audio. `--audio` installs an `AudioContext` tap (MediaStreamDestination + MediaRecorder) before page JS runs, enables the colophon Sound toggle during the scenario, then muxes video+audio with `ffmpeg`.

If the tap is empty: unlock failed, sounds never fired, or rate-limit ate them — check the harness log.

## Requirements

- `playwright` (devDependency) + Chromium (`npx playwright install chromium` once)
- `ffmpeg` on PATH for `--audio` mux
