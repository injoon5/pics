import type { Metadata } from "next";
import { SleeveDrawer } from "@/components/sleeve/SleeveDrawer";
import { albums } from "@/fixtures/photos";

export const metadata: Metadata = {
  title: {
    absolute: "Flipbook",
  },
  description: "Paper sleeves. Flip from the hinge.",
};

export default function HomePage() {
  const published = albums.filter((a) => a.published);

  return (
    <main className="min-h-dvh bg-surface text-text-primary">
      <header className="px-6 pt-10 pb-2 sm:px-10">
        <h1 className="type-title">Flipbook</h1>
        <p className="type-lab-stamp mt-2 text-[0.75rem]">
          {String(published.length).padStart(2, "0")} sleeves on the bench
        </p>
      </header>
      <SleeveDrawer albums={published} />
    </main>
  );
}
