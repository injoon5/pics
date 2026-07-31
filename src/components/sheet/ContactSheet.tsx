"use client";

/**
 * The contact sheet (§8).
 *
 * Base UI's `Dialog` supplies the behaviour: focus trap, escape, return-focus,
 * scroll lock, `aria-modal`. It supplies none of the appearance — the backdrop
 * is off and the element comes through `render`, so the motion stays in our
 * hands (§2.5).
 *
 * §2.5 says to render inline rather than through `Dialog.Portal`, because a
 * portal is the most likely thing to break the stack→sheet flight. Base UI
 * 1.6 makes the portal mandatory — `<Dialog.Popup>` throws without it — so we
 * satisfy the actual constraint instead of the letter of it: the portal is
 * given a `container` that sits in this component's own subtree, so the popup
 * never moves to `document.body` and stays where a shared-layout flight can
 * reach it.
 *
 * Enter and exit are CSS transitions keyed off Base UI's own
 * `data-starting-style` / `data-ending-style`, not `AnimatePresence`. Two
 * reasons: Base UI detects a finished animation with `element.getAnimations()`
 * and owning the mount itself is the only way that is reliable; and §3.3 wants
 * transitions rather than keyframes for anything retriggerable, so a sheet
 * toggled mid-flight retargets from where it is instead of restarting.
 *
 * The grid, the sprockets, the mark and the loupe are all hand-built. If you
 * find yourself styling a Base UI component into one of them, that is the
 * wrong turn §2.5 is warning about.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import type { Photo } from "@/fixtures/albums";
import { Sprockets } from "./Sprockets";
import { ChinagraphMark } from "./ChinagraphMark";
import { Loupe, type LoupeHandle } from "./Loupe";
import { durations, sheet as tokens, gesture, cssEase } from "@/design/tokens";
import { rubberband, shouldDismiss, VelocityTracker } from "@/lib/gesture";
import { jitter } from "@/lib/rng";
import { frameNumber } from "@/lib/format";
import { sources, fallbackSrc } from "@/lib/image";
import { play, unlock } from "@/design/sound";
import { useDials } from "@/design/dials";

export type ContactSheetProps = {
  photos: Photo[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (index: number) => void;
  lang: string;
};

export function ContactSheet({
  photos,
  index,
  open,
  onOpenChange,
  onSelect,
  lang,
}: ContactSheetProps) {
  const p = useDials("Sheet", {
    columns: [tokens.columns, 2, 5],
    enterScale: [tokens.thumbEnterScale, 0.8, 1],
    dismissVelocity: [gesture.dismissVelocity, 0.02, 0.4],
  });

  const [focused, setFocused] = useState(index);
  // The portal's container: in this component's own subtree, so the popup is
  // never relocated to <body>.
  const host = useRef<HTMLDivElement>(null);
  const loupe = useRef<LoupeHandle | null>(null);
  const onLoupeReady = useCallback((h: LoupeHandle) => {
    loupe.current = h;
  }, []);

  useEffect(() => {
    if (open) {
      setFocused(index);
      void unlock();
      play("sheetOpen");
    }
  }, [open, index]);

  const close = useCallback(() => {
    play("sheetClose");
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <div ref={host}>
      <Dialog.Root
        open={open}
        onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      >
        <Dialog.Portal container={host}>
          <Dialog.Popup
            className="sheet-popup fixed inset-0 z-50 overflow-y-auto bg-surface-sunk outline-none"
            style={{
              // The sheet grows from the hinge and collapses back to it — the
              // same path both ways, with the easing mirrored (§3.3).
              transformOrigin: "50% var(--hinge-y)",
              transitionDuration: `${durations.sheetToggle}ms`,
              transitionTimingFunction: cssEase.drawer,
            }}
          >
            <Dialog.Title className="sr-only">Frames</Dialog.Title>
            <SheetBody
              photos={photos}
              index={index}
              focused={focused}
              setFocused={setFocused}
              columns={p.columns}
              enterScale={p.enterScale}
              dismissVelocity={p.dismissVelocity}
              onSelect={(i) => {
                play("sheetClose");
                onSelect(i);
              }}
              onDismiss={close}
              loupe={loupe}
            />
            <Loupe lang={lang} onReady={onLoupeReady} />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function SheetBody({
  photos,
  index,
  focused,
  setFocused,
  columns,
  enterScale,
  dismissVelocity,
  onSelect,
  onDismiss,
  loupe,
}: {
  photos: Photo[];
  index: number;
  focused: number;
  setFocused: (i: number) => void;
  columns: number;
  enterScale: number;
  dismissVelocity: number;
  onSelect: (i: number) => void;
  onDismiss: () => void;
  loupe: React.RefObject<LoupeHandle | null>;
}) {
  const grid = useRef<HTMLDivElement>(null);

  /* ── the drag ──────────────────────────────────────────────────────────
     Dismiss on velocity, not distance. A flick should be enough; requiring
     the sheet to travel some fraction of the screen is exactly what makes web
     sheets feel unlike native ones (§3.4). */
  const drag = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startTime: 0,
    committed: false,
    longPress: 0 as ReturnType<typeof setTimeout> | 0,
    holding: false,
    tracker: new VelocityTracker(),
  });

  const frameUnder = (x: number, y: number) => {
    const el = document
      .elementsFromPoint(x, y)
      .find((n) => n instanceof HTMLElement && n.dataset.frame !== undefined);
    if (!(el instanceof HTMLElement)) return null;
    const i = Number(el.dataset.frame);
    return { i, photo: photos[i], rect: el.getBoundingClientRect() };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const d = drag.current;
    // Ignore additional touch points once a gesture has begun, or a second
    // finger jumps the sheet (§3.4).
    if (d.active) return;

    d.active = true;
    d.pointerId = e.pointerId;
    d.startX = e.clientX;
    d.startY = e.clientY;
    d.startTime = performance.now();
    d.committed = false;
    d.holding = false;
    d.tracker.reset();
    d.tracker.add(e.clientY);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    // Press-and-hold reveals the loupe. 450ms is long enough that a tap never
    // triggers it and short enough that a deliberate hold doesn't feel stuck.
    d.longPress = setTimeout(() => {
      const hit = frameUnder(e.clientX, e.clientY);
      if (!hit?.photo) return;
      d.holding = true;
      loupe.current?.show(hit.photo, hit.rect, e.clientX, e.clientY);
    }, durations.loupeReveal);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    d.tracker.add(e.clientY);

    if (d.holding) {
      // Sliding across frames without lifting: the readout tracks the frame
      // under the thumb. No React state on this path.
      const hit = frameUnder(e.clientX, e.clientY);
      if (hit?.photo) loupe.current?.move(hit.photo, hit.rect, e.clientX, e.clientY);
      return;
    }

    if (!d.committed) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < gesture.hysteresis) return;
      d.committed = true;
      clearTimeout(d.longPress);
    }

    // Resistance rather than a hard stop: the sheet gives, which tells you it
    // is being held rather than that you have hit a wall (§3.4).
    const resisted = rubberband(dy, window.innerHeight);
    const el = grid.current?.parentElement;
    if (el) el.style.transform = `translate3d(0, ${resisted}px, 0)`;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;

    clearTimeout(d.longPress);
    d.active = false;

    const el = grid.current?.parentElement;
    if (el) {
      el.style.transition = `transform ${durations.sheetToggle}ms ${cssEase.drawer}`;
      el.style.transform = "";
      setTimeout(() => {
        if (el) el.style.transition = "";
      }, durations.sheetToggle);
    }

    if (d.holding) {
      loupe.current?.hide();
      d.holding = false;
      return;
    }

    const dy = e.clientY - d.startY;
    const elapsed = performance.now() - d.startTime;

    if (d.committed) {
      if (Math.abs(dy) / elapsed > dismissVelocity) onDismiss();
      return;
    }

    // Not a drag: a tap. Commit on touch-up (§3.4).
    const hit = frameUnder(e.clientX, e.clientY);
    if (hit && hit.photo) onSelect(hit.i);
  };

  /* ── roving tabindex (§13) ─────────────────────────────────────────── */
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    if (e.key in step) {
      e.preventDefault();
      const next = Math.max(0, Math.min(photos.length - 1, focused + step[e.key]));
      setFocused(next);
      grid.current
        ?.querySelector<HTMLElement>(`[data-frame="${next}"]`)
        ?.focus({ preventScroll: false });
    }
  };

  return (
    <div
      className="sheet-frame relative min-h-full px-8 pb-16 pt-10"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "none" }}
    >
      <Sprockets side="left" />
      <Sprockets side="right" />

      <div
        ref={grid}
        role="grid"
        aria-label="Frames"
        className="grid gap-[10px]"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        onKeyDown={onKeyDown}
      >
        {photos.map((photo, i) => {
          const seed = jitter(photo.id);
          return (
            <button
              key={photo.id}
              type="button"
              data-frame={i}
              tabIndex={i === focused ? 0 : -1}
              aria-label={photo.alt}
              aria-current={i === index}
              onFocus={() => setFocused(i)}
              className="sheet-thumb press relative block aspect-square min-h-[40px] w-full bg-surface p-[3px]"
              style={
                {
                  borderRadius: "var(--radius-card)",
                  // The same seed the stack and the sleeve use, so a given
                  // print sits at the same angle everywhere (§5.3).
                  "--angle": `${seed.dr}deg`,
                  // Never from zero. Nothing in the real world appears from
                  // nothing (§3.3).
                  "--enter-scale": enterScale,
                  // Decorative stagger, capped so a long album's last frame
                  // isn't still arriving after the sheet has settled.
                  transitionDelay: `${Math.min(i, 8) * 18}ms`,
                  transitionDuration: `${durations.sheetToggle}ms`,
                  transitionTimingFunction: cssEase.drawer,
                } as React.CSSProperties
              }
            >
              <picture>
                {sources(photo).map((s) => (
                  <source
                    key={s.type}
                    type={s.type}
                    srcSet={s.srcSet}
                    sizes="33vw"
                  />
                ))}
                <img
                  src={fallbackSrc(photo)}
                  alt=""
                  className="print-outline h-full w-full rounded-image object-cover"
                  decoding="async"
                  loading="lazy"
                />
              </picture>

              <span className="frame-number absolute -bottom-[15px] left-0 text-[10px] text-text-tertiary">
                {frameNumber(i)}
              </span>

              <ChinagraphMark id={photo.id} drawn={i === index} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
