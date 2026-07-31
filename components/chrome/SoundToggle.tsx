"use client";

import { motion, AnimatePresence } from "motion/react";
import { useSoundSettings } from "./AppSoundProvider";

export function SoundToggle() {
  const { enabled, toggle } = useSoundSettings();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? "Mute sound" : "Unmute sound"}
      aria-pressed={enabled}
      className="active:scale-[0.96] relative flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-neutral-900 backdrop-blur-md transition-transform duration-150 dark:bg-black/40 dark:text-neutral-100"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {enabled ? (
          <motion.svg
            key="on"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            <path
              d="M2 6v4h2.5L8 12.5v-9L4.5 6H2z"
              fill="currentColor"
            />
            <path
              d="M10.5 5.5a3 3 0 0 1 0 5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M12 4a5.5 5.5 0 0 1 0 8"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.6"
            />
          </motion.svg>
        ) : (
          <motion.svg
            key="off"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            <path d="M2 6v4h2.5L8 12.5v-9L4.5 6H2z" fill="currentColor" />
            <path
              d="M10.5 6.5l3 3M13.5 6.5l-3 3"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
}
