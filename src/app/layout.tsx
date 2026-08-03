import type { Metadata, Viewport } from "next";
import { Interlude } from "interlude-ui/font";
import { DevTools } from "@/components/DevTools";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Flipbook",
    template: "%s · Flipbook",
  },
  description: "Paper sleeves. Flip from the hinge.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Flipbook",
  },
  other: {
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "oklch(0.972 0.004 86)",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${Interlude.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-surface font-sans text-text-primary">
        {children}
        <DevTools />
      </body>
    </html>
  );
}
