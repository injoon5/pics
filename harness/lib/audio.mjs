import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Patch AudioContext so every destination also feeds a MediaStreamDestination,
 * then MediaRecorder captures the mix. Must be installed before page scripts
 * create their contexts (@web-kits/audio).
 */
export async function installAudioTap(page) {
  await page.addInitScript(() => {
    const g = globalThis;
    if (g.__flipbookAudioTapInstalled) return;
    g.__flipbookAudioTapInstalled = true;

    const NativeAC = g.AudioContext || g.webkitAudioContext;
    if (!NativeAC) return;

    const chunks = [];
    let recorder = null;
    let dest = null;
    let ctxRef = null;

    function ensureRecorder(ctx) {
      if (recorder) return;
      ctxRef = ctx;
      dest = ctx.createMediaStreamDestination();
      // Tee master output: wrap destination.connect if needed by also connecting
      // every node that connects to ctx.destination → also to dest.
      const nativeConnect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function (...args) {
        const result = nativeConnect.apply(this, args);
        try {
          if (args[0] === ctx.destination && dest) {
            nativeConnect.call(this, dest);
          }
        } catch {
          /* ignore fan-out failures */
        }
        return result;
      };

      recorder = new MediaRecorder(dest.stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.start(200);
      g.__flipbookAudioTap = {
        chunks,
        recorder,
        stop: () =>
          new Promise((resolve) => {
            if (!recorder || recorder.state === "inactive") {
              resolve(null);
              return;
            }
            recorder.onstop = () => {
              const blob = new Blob(chunks, { type: recorder.mimeType });
              resolve(blob);
            };
            recorder.stop();
          }),
      };
    }

    class TappedAudioContext extends NativeAC {
      constructor(...args) {
        super(...args);
        try {
          ensureRecorder(this);
        } catch (err) {
          console.warn("[audio-tap] init failed", err);
        }
      }
    }

    g.AudioContext = TappedAudioContext;
    if (g.webkitAudioContext) g.webkitAudioContext = TappedAudioContext;
  });
}

/** Stop recorder and write bytes to disk. Returns path or null. */
export async function downloadAudioTap(page, outPath) {
  const result = await page.evaluate(async () => {
    const tap = globalThis.__flipbookAudioTap;
    if (!tap) return null;
    const blob = await tap.stop();
    if (!blob || blob.size === 0) return null;
    const buf = await blob.arrayBuffer();
    const bytes = Array.from(new Uint8Array(buf));
    return { bytes, type: blob.type };
  });

  if (!result) return null;
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, Buffer.from(result.bytes));
  return outPath;
}

/** Mux Playwright video + tapped audio into mp4 via ffmpeg. */
export function muxAv(videoPath, audioPath, outPath) {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i",
      videoPath,
      "-i",
      audioPath,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-shortest",
      "-movflags",
      "+faststart",
      outPath,
    ];
    const p = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    p.stderr?.on("data", (d) => {
      err += String(d);
    });
    p.on("exit", (code) => {
      if (code === 0) resolve(outPath);
      else reject(new Error(`ffmpeg mux failed (${code}): ${err.slice(-800)}`));
    });
  });
}
