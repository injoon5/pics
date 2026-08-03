/**
 * Flipbook agent harness — screenshots + video (+ optional audio).
 *
 * Usage:
 *   npm run harness -- screenshots
 *   npm run harness -- video
 *   npm run harness -- video --audio
 *   npm run harness -- all --audio
 *   npm run harness -- --url http://127.0.0.1:3000   # reuse running server
 *
 * Artifacts land in artifacts/harness/ and /opt/cursor/artifacts/harness/ when present.
 */

import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ensureServer, stopServer } from "./lib/server.mjs";
import { installAudioTap, downloadAudioTap, muxAv } from "./lib/audio.mjs";
import { runScenarios } from "./lib/scenarios.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const VIEWPORTS = {
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { width: 1280, height: 800, deviceScaleFactor: 1 },
};

function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args.find((a) => !a.startsWith("-")) ?? "all";
  return {
    cmd,
    audio: args.includes("--audio"),
    headed: args.includes("--headed"),
    url: flagValue(args, "--url"),
    out: flagValue(args, "--out") ?? path.join(ROOT, "artifacts", "harness"),
    album: flagValue(args, "--album") ?? "east-coast-roll",
    slowMo: Number(flagValue(args, "--slowmo") ?? 0),
  };
}

function flagValue(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  return args[i + 1];
}

async function mirrorToCursorArtifacts(filePath) {
  const destRoot = "/opt/cursor/artifacts/harness";
  try {
    await mkdir(destRoot, { recursive: true });
  } catch {
    return;
  }
  try {
    const dest = path.join(destRoot, path.basename(filePath));
    await copyFile(filePath, dest);
    return dest;
  } catch {
    return;
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  await mkdir(opts.out, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const runDir = path.join(opts.out, stamp);
  await mkdir(runDir, { recursive: true });
  await mkdir(path.join(runDir, "screens"), { recursive: true });
  await mkdir(path.join(runDir, "video"), { recursive: true });

  console.log(`[harness] out → ${runDir}`);

  const { baseUrl, started } = await ensureServer({
    root: ROOT,
    url: opts.url,
  });
  console.log(`[harness] app → ${baseUrl}${started ? " (started)" : " (reused)"}`);

  const doScreens = opts.cmd === "screenshots" || opts.cmd === "all";
  const doVideo = opts.cmd === "video" || opts.cmd === "all";

  const manifest = {
    stamp,
    baseUrl,
    audio: opts.audio,
    screens: [],
    videos: [],
  };

  try {
    if (doScreens) {
      for (const [name, vp] of Object.entries(VIEWPORTS)) {
        const browser = await chromium.launch({
          headless: !opts.headed,
          slowMo: opts.slowMo,
          args: ["--autoplay-policy=no-user-gesture-required"],
        });
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: vp.deviceScaleFactor,
          isMobile: vp.isMobile ?? false,
          hasTouch: vp.hasTouch ?? false,
          colorScheme: "light",
        });
        const page = await context.newPage();
        page.on("console", (msg) => {
          if (msg.type() === "error") console.warn(`[console:${name}]`, msg.text());
        });

        const shots = await runScenarios(page, {
          baseUrl: baseUrl,
          album: opts.album,
          mode: "screenshots",
          viewportName: name,
          outDir: path.join(runDir, "screens"),
        });

        for (const shot of shots) {
          manifest.screens.push(shot);
          const mirrored = await mirrorToCursorArtifacts(shot.path);
          if (mirrored) console.log(`[harness] mirrored ${mirrored}`);
        }

        await context.close();
        await browser.close();
      }
    }

    if (doVideo) {
      const vp = VIEWPORTS.mobile;
      const videoDir = path.join(runDir, "video", "raw");
      await mkdir(videoDir, { recursive: true });

      const browser = await chromium.launch({
        headless: !opts.headed,
        slowMo: opts.slowMo || 40,
        args: ["--autoplay-policy=no-user-gesture-required"],
      });
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: true,
        hasTouch: true,
        recordVideo: {
          dir: videoDir,
          size: { width: vp.width, height: vp.height },
        },
      });
      const page = await context.newPage();
      page.on("console", (msg) => {
        if (msg.type() === "error") console.warn("[console:video]", msg.text());
      });

      if (opts.audio) {
        await installAudioTap(page);
      }

      await runScenarios(page, {
        baseUrl,
        album: opts.album,
        mode: "video",
        viewportName: "mobile",
        outDir: path.join(runDir, "screens"),
        enableSound: opts.audio,
      });

      let audioPath = null;
      if (opts.audio) {
        audioPath = await downloadAudioTap(page, path.join(runDir, "video", `audio-${stamp}.webm`));
        if (audioPath) console.log(`[harness] audio → ${audioPath}`);
        else console.warn("[harness] audio tap produced no data (sound may be silent / unlock failed)");
      }

      await context.close();
      await browser.close();

      // Playwright writes one webm per page; pick the newest
      const { readdir } = await import("node:fs/promises");
      const rawFiles = (await readdir(videoDir)).filter((f) => f.endsWith(".webm"));
      if (rawFiles.length === 0) throw new Error("No Playwright video written");
      const rawVideo = path.join(videoDir, rawFiles[rawFiles.length - 1]);
      const finalVideo = path.join(
        runDir,
        "video",
        opts.audio && audioPath ? `flipbook-${stamp}.mp4` : `flipbook-${stamp}.webm`,
      );

      if (opts.audio && audioPath) {
        await muxAv(rawVideo, audioPath, finalVideo);
      } else {
        await copyFile(rawVideo, finalVideo);
      }

      manifest.videos.push({
        path: finalVideo,
        audio: Boolean(audioPath),
        raw: rawVideo,
      });
      const mirrored = await mirrorToCursorArtifacts(finalVideo);
      if (mirrored) console.log(`[harness] mirrored ${mirrored}`);
      console.log(`[harness] video → ${finalVideo}`);
    }
  } finally {
    if (started) await stopServer();
  }

  const manifestPath = path.join(runDir, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  // convenience pointer for agents
  await writeFile(
    path.join(opts.out, "latest.json"),
    JSON.stringify({ runDir, ...manifest }, null, 2),
  );
  console.log(`[harness] manifest → ${manifestPath}`);
  console.log(`[harness] done (${manifest.screens.length} screens, ${manifest.videos.length} videos)`);
}

main().catch((err) => {
  console.error("[harness] failed:", err);
  process.exit(1);
});
