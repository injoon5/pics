import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Studio",
  description: "Studio arrives in phase 8.",
};

export default function StudioPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-6 text-center text-text-primary">
      <p className="type-title text-text-secondary">Studio arrives in phase 8.</p>
      <Link
        href="/"
        className="type-lab-stamp text-[0.75rem] text-accent underline-offset-4 hover:underline"
      >
        ← Back to sleeves
      </Link>
    </main>
  );
}
