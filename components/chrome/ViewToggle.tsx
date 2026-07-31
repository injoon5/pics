"use client";

import { motion } from "motion/react";
import { useSound } from "@web-kits/audio/react";
import { tapSound } from "@/lib/audio";

export type StackView = "stack" | "grid";

export function ViewToggle({
  view,
  onChange,
}: {
  view: StackView;
  onChange: (view: StackView) => void;
}) {
  const playTap = useSound(tapSound);
  const options: { key: StackView; label: string }[] = [
    { key: "stack", label: "Stack" },
    { key: "grid", label: "Grid" },
  ];

  return (
    <div className="relative flex items-center rounded-full bg-white/70 p-1 text-sm backdrop-blur-md dark:bg-black/40">
      {options.map((opt) => {
        const active = view === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              if (opt.key !== view) playTap();
              onChange(opt.key);
            }}
            className="active:scale-[0.96] relative flex min-h-10 min-w-[3.5rem] items-center justify-center rounded-full px-3 text-neutral-500 transition-transform duration-150 dark:text-neutral-400"
            aria-pressed={active}
          >
            {active ? (
              <motion.span
                layoutId="view-toggle-pill"
                className="absolute inset-0 rounded-full bg-neutral-900 dark:bg-neutral-100"
                transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              />
            ) : null}
            <span
              className={`relative z-10 ${
                active ? "text-neutral-50 dark:text-neutral-900" : ""
              }`}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
