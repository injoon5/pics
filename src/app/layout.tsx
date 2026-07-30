import type { Metadata, Viewport } from "next";
import "./globals.css";
import { flipKeyframes } from "@/lib/easing";
import { DevHarness } from "@/components/dev/DevHarness";

export const metadata: Metadata = {
  title: "Flipbook",
  description: "A pad of prints.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    // §6.2 — lets the page's own colour run under the status bar, which is
    // most of the difference between "a website" and "an app".
    statusBarStyle: "black-translucent",
    title: "Flipbook",
  },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The pad is a fixed-size object; zooming it produces a broken hinge rather
  // than a bigger photograph. Text in the caption panel is still selectable
  // and the browser's own text size setting is respected.
  maximumScale: 1,
  viewportFit: "cover",
  // Overwritten per settled photo by useAppearance (§6.2).
  themeColor: "#f8f7f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-appearance="light">
      <head>
        {/* §4.1 — the flip curve as sampled keyframe stops. It has to live in
            the keyframes rather than in `animation-timing-function`, because a
            scroll timeline applies a timing function *per keyframe pair* and
            you get the ease restarting between each one. Derived from
            `tokens.ts` on the server, so there is exactly one source of truth
            for the curve across both paths. */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: flipKeyframes() }}
        />
        {/* Preloaded rather than left to the dynamic-subset CSS to discover:
            the base subset is the Latin face, and it is on the critical path
            for every album (§3.2). */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/interlude/InterludeVariable.subset.base.woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}

        {/* The crossfade veil (§6.2). A sibling of the stage, never an
            ancestor: it carries the 2px masking blur, and a filter above the
            3D context flattens it on iOS (§5.6). */}
        <div
          id="appearance-veil"
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[70] opacity-0"
          style={{ background: "var(--color-surface)", filter: "blur(2px)" }}
        />

        <DevHarness />
      </body>
    </html>
  );
}
