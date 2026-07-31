"use client";

import Link from "next/link";
import { SoundToggle } from "@/components/chrome/SoundToggle";
import { ViewToggle, type StackView } from "@/components/chrome/ViewToggle";
import { ProgressiveBlur } from "./ProgressiveBlur";

/**
 * Controls only, on a single row — the prints need every pixel of the two
 * halves, so naming and progress live on the bottom rail instead.
 */
export function TopScrim({
  view,
  onViewChange,
}: {
  view: StackView;
  onViewChange: (view: StackView) => void;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-30">
      <ProgressiveBlur height="7rem" />
      <div
        className="relative flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        <Link
          href="/albums"
          aria-label="Back to albums"
          className="active:scale-[0.96] flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-neutral-900 backdrop-blur-md transition-transform duration-150 dark:bg-black/40 dark:text-neutral-100"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <ViewToggle view={view} onChange={onViewChange} />

        <SoundToggle />
      </div>
    </div>
  );
}
