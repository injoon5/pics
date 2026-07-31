"use client";

/**
 * §5.6 — the iOS 3D killers, as a runtime assertion.
 *
 * Any of `opacity < 1`, `filter`, `backdrop-filter`, `mask`, `overflow: hidden`
 * with a `border-radius`, or `will-change` on anything but `transform` on an
 * *ancestor* of `.stage` flattens the 3D context on iOS, and the entire pad
 * collapses to a 2D scale. On desktop Safari and Chrome it mostly still works,
 * which is exactly why this is so easy to ship by accident.
 *
 * You will trip this at least twice. That is the point of it existing.
 *
 * Dev only — it is imported behind `dialsEnabled` and never mounted in a
 * production build.
 */

import { useEffect } from "react";

export function StageAssert() {
  useEffect(() => {
    const check = () => {
      const stage = document.querySelector(".stage");
      if (!stage) return;

      const problems: string[] = [];
      let node = stage.parentElement;

      // Includes <html>: it is an ancestor like any other, and a filter
      // there flattens the context just as effectively.
      while (node) {
        const s = getComputedStyle(node);
        const at = describe(node);

        if (s.opacity !== "1") problems.push(`${at} — opacity: ${s.opacity}`);
        if (s.filter !== "none") problems.push(`${at} — filter: ${s.filter}`);
        if (s.backdropFilter && s.backdropFilter !== "none") {
          problems.push(`${at} — backdrop-filter: ${s.backdropFilter}`);
        }
        if (s.maskImage && s.maskImage !== "none") {
          problems.push(`${at} — mask-image: ${s.maskImage}`);
        }
        if (s.overflow !== "visible" && parseFloat(s.borderTopLeftRadius) > 0) {
          problems.push(`${at} — overflow: ${s.overflow} with a border-radius`);
        }
        if (s.willChange !== "auto" && s.willChange !== "transform") {
          problems.push(`${at} — will-change: ${s.willChange}`);
        }

        node = node.parentElement;
      }

      if (problems.length) {
        console.error(
          "§5.6 — an ancestor of .stage flattens the 3D context on iOS:\n  " +
            problems.join("\n  "),
        );
      }
    };

    // After paint, and again after a beat: the offenders that matter are
    // usually introduced by a transition that hasn't started yet on the first
    // frame (an AnimatePresence enter, a veil fading out).
    const raf = requestAnimationFrame(check);
    const timer = setTimeout(check, 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  return null;
}

const describe = (el: Element) =>
  `<${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${
    el.className && typeof el.className === "string"
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
      : ""
  }>`;
