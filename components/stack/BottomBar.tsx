"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

export function BottomBar({ note }: { note: string }) {
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

  if (!note) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      animate={{ y: visible ? 0 : 28, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
    >
      <p className="max-w-[82vw] truncate rounded-full bg-white/70 px-4 py-2 text-sm text-neutral-700 backdrop-blur-md dark:bg-black/40 dark:text-neutral-300">
        {note}
      </p>
    </motion.div>
  );
}
