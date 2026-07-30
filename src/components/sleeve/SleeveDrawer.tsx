"use client";

import Link from "next/link";
import type { Album } from "@/fixtures/types";
import { Sleeve } from "./Sleeve";

export function SleeveDrawer({ albums }: { albums: Album[] }) {
  if (albums.length === 0) {
    return (
      <div
        className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6 text-center"
        data-harness="sleeve-drawer"
      >
        <p className="type-title text-text-secondary">No albums yet.</p>
        <Link
          href="/studio"
          className="type-lab-stamp text-[0.75rem] text-accent underline-offset-4 hover:underline"
        >
          Start one →
        </Link>
      </div>
    );
  }

  return (
    <ul
      className="mx-auto grid w-full max-w-5xl list-none grid-cols-1 gap-10 px-6 py-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-3 lg:gap-14"
      data-harness="sleeve-drawer"
    >
      {albums.map((album) => (
        <li key={album.slug} className="flex justify-center">
          <Sleeve album={album} />
        </li>
      ))}
    </ul>
  );
}
