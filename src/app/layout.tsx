import type { Metadata } from "next";
import { Interlude } from "interlude-ui/font";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Flipbook",
    template: "%s · Flipbook",
  },
  description: "Paper sleeves. Flip from the hinge.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Flipbook",
  },
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
      </body>
    </html>
  );
}
