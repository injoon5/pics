"use client";

/**
 * The loupe (§8).
 *
 * Press and hold a frame and a circular magnifier appears under the thumb at
 * 2.5×. Slide across frames *without lifting* and the readout under the glass
 * updates continuously. Whimsy, and also the fastest way to identify a photo.
 *
 * Asymmetric on purpose (§3.3): 450ms to reveal — slow, the user is deciding —
 * and 140ms to dismiss — fast, the system responds.
 *
 * This is the one surface in the product where text morphs, because it is the
 * one surface that is explicitly an instrument: glass, not paper. Everything
 * printed on a card swaps. See the note in §2.6, and don't move torph out of
 * here.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTextMorph } from "torph/react";
import type { Photo } from "@/fixtures/albums";
import { durations, loupe as tokens, cssEase } from "@/design/tokens";
import { loupeReadout } from "@/lib/format";
import { fallbackSrc } from "@/lib/image";
import { play } from "@/design/sound";

export type LoupeHandle = {
  show: (photo: Photo, rect: DOMRect, clientX: number, clientY: number) => void;
  move: (photo: Photo, rect: DOMRect, clientX: number, clientY: number) => void;
  hide: () => void;
};

export function Loupe({
  lang,
  onReady,
}: {
  /** From the album. Without it torph segments hangul character-by-character
   *  via the default "en", which looks broken (§2.6). */
  lang: string;
  onReady: (handle: LoupeHandle) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const glass = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const currentId = useRef<string | null>(null);
  const frame = useRef(0);

  // The hook, not the component: the readout updates from a pointermove
  // handler, and routing that through React state would put a re-render on
  // every frame of a drag (§0.3).
  const { ref: readoutRef, update } = useTextMorph({
    ease: { stiffness: 200, damping: 26 },
    locale: lang,
  });

  const paint = useCallback(
    (photo: Photo, rect: DOMRect, clientX: number, clientY: number) => {
      const el = glass.current;
      if (!el || !wrap.current) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const m = tokens.magnification;

      // The whole assembly moves — glass *and* readout — so the transform goes
      // on the wrapper. Writing `transform` here and letting React own
      // `scale`/`opacity` as separate properties means the two never fight
      // over one declaration.
      wrap.current.style.transform = `translate3d(${clientX - tokens.diameter / 2}px, ${
        clientY - tokens.diameter - 24
      }px, 0)`;
      el.style.backgroundImage = `url(${fallbackSrc(photo)})`;
      el.style.backgroundSize = `${rect.width * m}px ${rect.height * m}px`;
      el.style.backgroundPosition = `${tokens.diameter / 2 - x * m}px ${
        tokens.diameter / 2 - y * m
      }px`;

      if (currentId.current !== photo.id) {
        currentId.current = photo.id;
        // Spring easing, because this is gesture-driven and should carry
        // momentum. torph interrupts cleanly, so a fast slide morphs
        // continuously rather than queueing.
        update(loupeReadout(photo.exif));
        play("mark");
      }
    },
    [update],
  );

  useEffect(() => {
    onReady({
      show: (photo, rect, x, y) => {
        setVisible(true);
        currentId.current = null;
        paint(photo, rect, x, y);
      },
      // Throttled to one per frame. A pointermove can fire faster than the
      // display on a 120Hz iPhone, and there is no point morphing twice
      // between two frames nobody sees.
      move: (photo, rect, x, y) => {
        if (frame.current) return;
        frame.current = requestAnimationFrame(() => {
          frame.current = 0;
          paint(photo, rect, x, y);
        });
      },
      hide: () => {
        setVisible(false);
        currentId.current = null;
      },
    });
  }, [onReady, paint]);

  useEffect(() => {
    const block = (e: Event) => {
      if (visible) e.preventDefault();
    };
    document.addEventListener("contextmenu", block);
    return () => document.removeEventListener("contextmenu", block);
  }, [visible]);

  return (
    <div
      ref={wrap}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60]"
      style={{
        transformOrigin: "50% 120%",
        // Enter and exit follow the same path; only the durations differ.
        transition: `opacity ${
          visible ? durations.loupeReveal : durations.loupeDismiss
        }ms ${cssEase.out}, scale ${
          visible ? durations.loupeReveal : durations.loupeDismiss
        }ms ${cssEase.out}`,
        opacity: visible ? 1 : 0,
        // Never from zero — nothing in the real world appears from nothing.
        scale: visible ? 1 : 0.94,
      }}
    >
      <div
        ref={glass}
        className="relative"
        style={{
          width: tokens.diameter,
          height: tokens.diameter,
          borderRadius: "50%",
          backgroundRepeat: "no-repeat",
          // The glass edge: a thick inner shadow for the bevel, a hairline
          // ring for the mount, and a soft drop so it sits *above* the sheet.
          boxShadow: `inset 0 0 18px 6px oklch(0 0 0 / ${tokens.glassEdgeAlpha}),
                      0 0 0 1px oklch(0 0 0 / 0.25),
                      0 10px 28px oklch(0 0 0 / 0.28)`,
        }}
      >
        {/* The specular arc — one 1px highlight along the upper left, which is
            what tells you it is a lens rather than a hole. */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 200deg, transparent 0deg, oklch(1 0 0 / ${tokens.specularAlpha}) 28deg, transparent 62deg)`,
            maskImage: "radial-gradient(circle, transparent 62%, black 66%, black 100%)",
            WebkitMaskImage:
              "radial-gradient(circle, transparent 62%, black 66%, black 100%)",
          }}
        />
      </div>

      {/* The readout sits under the glass, outside `.stage` — torph rewrites
          per-glyph DOM on every update, and doing that inside a 3D context
          during a flip is both a jank source and a flattening risk (§2.6). */}
      <div
        className="exif mt-2 text-center text-[11px] text-text-secondary"
        style={{ width: tokens.diameter }}
      >
        <span ref={readoutRef as React.Ref<HTMLSpanElement>} />
      </div>
    </div>
  );
}
