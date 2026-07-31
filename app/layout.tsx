import type { Metadata, Viewport } from "next";
import { Interlude, InterludeDisplay } from "interlude-ui/font";
import { AppSoundProvider } from "@/components/chrome/AppSoundProvider";
import { DialProvider } from "@/components/dial/DialProvider";
import "dialkit/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "pics",
  description: "A photo portfolio.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const FOUC_SCRIPT = `
(function () {
  try {
    var match = document.cookie.match(/theme=([^;]+)/);
    var saved = match ? match[1] : null;
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!document.cookie.match(/theme=/)) {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    });
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${Interlude.variable} ${InterludeDisplay.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <AppSoundProvider>
          {children}
          {process.env.NODE_ENV === "development" ? <DialProvider /> : null}
        </AppSoundProvider>
      </body>
    </html>
  );
}
