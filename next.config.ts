import type { NextConfig } from "next";
import path from "node:path";

const isProd = process.env.NODE_ENV === "production";

/**
 * DialKit is a development-only harness (§2, §14). The `useDials` shim in
 * `src/design/dials.ts` already dead-code-eliminates the `require("dialkit")`
 * branch in production, but a resolve alias to a stub guarantees it: if the
 * dead-code elimination ever regresses, the bundle still cannot contain it.
 *
 * Verify with: `npm run build && grep -rl dialkit .next/static` (expect no hits).
 */
// Turbopack resolves aliases against the project root and rejects absolute
// server paths; webpack wants an absolute one. They are the same file.
const stubRelative = "./src/design/dialkit-stub.ts";
const stubAbsolute = path.resolve(stubRelative);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: isProd ? { dialkit: stubRelative } : {},
  },
  webpack(config) {
    if (isProd) {
      config.resolve.alias = { ...config.resolve.alias, dialkit: stubAbsolute };
    }
    return config;
  },
};

export default nextConfig;
