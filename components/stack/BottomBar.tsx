"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { TextMorph } from "torph/react";

/**
 * Naming and progress. Retracts on scroll-down so it never sits under iOS
 * Safari's floating tab bar, and returns as soon as the reader scrolls back.
 */
export function BottomBar({
  count,
  activeIndex,
  title,
}: {
  count: number;
  activeIndex: number;
  title: string;
}) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (Math.abs(delta) > 4) {
          setVisible(delta < 0 || y < 40);
          lastY.current = y;
        }
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (count < 1) return null;
  const current = Math.min(activeIndex, count - 1);

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      animate={{ y: visible ? 0 : 32, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="flex max-w-full items-center gap-2.5 rounded-full bg-white/70 py-2 pl-3.5 pr-3 backdrop-blur-md dark:bg-black/40">
        <TextMorph
          className="truncate text-sm text-neutral-900 dark:text-neutral-100"
          as="span"
        >
          {title}
        </TextMorph>
        <span className="tabular-nums shrink-0 text-sm text-neutral-400 dark:text-neutral-500">
          <NumberFlow value={current + 1} />/{count}
        </span>
        <span aria-hidden className="flex shrink-0 items-center gap-1 pl-0.5">
          {Array.from({ length: count }).map((_, i) => (
            <motion.span
              key={i}
              className="block h-1 rounded-full bg-neutral-900 dark:bg-neutral-100"
              animate={{
                width: i === current ? 14 : 5,
                opacity: i === current ? 1 : 0.25,
              }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}
