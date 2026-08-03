import { spawn } from "node:child_process";
import { createServer } from "node:net";

const DEFAULT_PORT = 3010;

function canListen(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function waitForUrl(url, timeoutMs = 60_000) {
  const start = Date.now();
  let lastErr;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0 && res.status < 500) return;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server not ready at ${url}: ${lastErr?.message ?? lastErr}`);
}

/** @type {import('node:child_process').ChildProcess | null} */
let child = null;

/**
 * Reuse --url if given / already listening, else `next start` on a free port.
 * Prefers production server (faster, stable) — runs build if .next missing.
 */
export async function ensureServer({ root, url }) {
  if (url) {
    await waitForUrl(url);
    return { baseUrl: url.replace(/\/$/, ""), started: false };
  }

  // Prefer an already-running local app that actually serves Flipbook
  for (const port of [3000, 3001, DEFAULT_PORT]) {
    try {
      const probe = `http://127.0.0.1:${port}`;
      const res = await fetch(probe, { redirect: "manual" });
      if (!res.ok) continue;
      const html = await res.text();
      if (html.includes("Flipbook") || html.includes("data-harness")) {
        return { baseUrl: probe, started: false };
      }
    } catch {
      /* try next */
    }
  }

  let port = DEFAULT_PORT;
  if (!(await canListen(port))) {
    port = DEFAULT_PORT + Math.floor(Math.random() * 1000);
  }

  const { existsSync } = await import("node:fs");
  const path = await import("node:path");
  if (!existsSync(path.join(root, ".next"))) {
    console.log("[harness] building Next app…");
    await run(root, "npm", ["run", "build"]);
  }

  console.log(`[harness] starting next start -p ${port}`);
  child = spawn("npx", ["next", "start", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production", PORT: String(port) },
  });

  child.stdout?.on("data", (d) => {
    const s = String(d);
    if (s.includes("Error") || s.includes("✓")) process.stdout.write(`[next] ${s}`);
  });
  child.stderr?.on("data", (d) => process.stderr.write(`[next:err] ${d}`));

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForUrl(baseUrl);
  return { baseUrl, started: true };
}

export async function stopServer() {
  if (!child || child.killed) return;
  child.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 500));
  if (!child.killed) child.kill("SIGKILL");
  child = null;
}

function run(cwd, cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: "inherit", shell: false });
    p.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}
