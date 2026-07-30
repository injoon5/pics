"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import clsx from "clsx";
import { ease, gesture, motion as motionTokens } from "@/design/tokens";
import { frameLabel } from "@/lib/format";
import { playSheetClose, playSheetOpen } from "@/lib/sound-player";
import type { Album } from "@/fixtures/types";
import { Chinagraph } from "./Chinagraph";
import { Loupe } from "./Loupe";
import { Sprockets } from "./Sprockets";
import { useSheetGestures } from "./useSheetGestures";

export function ContactSheet({
  album,
  open,
  onOpenChange,
  currentIndex,
  onSelectIndex,
}: {
  album: Album;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}) {
  const portalContainerRef = useRef<HTMLDivElement>(null);
  const sheetBodyRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdOriginRef = useRef<{ x: number; y: number; index: number } | null>(null);
  const didSelectRef = useRef(false);
  const wasOpenRef = useRef(false);

  const [loupeActive, setLoupeActive] = useState(false);

  const close = useCallback(() => {
    setLoupeActive(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { offsetY, dragging, handlers: dragHandlers } = useSheetGestures({
    enabled: open && !loupeActive,
    onDismiss: close,
  });

  useEffect(() => {
    if (open && !wasOpenRef.current) void playSheetOpen();
    if (!open && wasOpenRef.current) void playSheetClose();
    wasOpenRef.current = open;
    if (!open) {
      setLoupeActive(false);
      clearHold();
    }
  }, [open]);

  useEffect(() => () => clearHold(), []);

  function clearHold() {
    if (holdTimerRef.current != null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdOriginRef.current = null;
  }

  const onGridPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      const cell = (event.target as Element | null)?.closest<HTMLElement>("[data-photo-index]");
      if (!cell) return;
      const index = Number(cell.dataset.photoIndex);
      if (!Number.isFinite(index)) return;

      pointerRef.current = { x: event.clientX, y: event.clientY };
      holdOriginRef.current = { x: event.clientX, y: event.clientY, index };
      didSelectRef.current = false;

      clearHold();
      holdTimerRef.current = setTimeout(() => {
        setLoupeActive(true);
        holdTimerRef.current = null;
      }, motionTokens.loupeRevealMs);
    },
    [],
  );

  const onGridPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      const origin = holdOriginRef.current;
      if (!origin || loupeActive) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (Math.hypot(dx, dy) > gesture.hysteresisPx) {
        clearHold();
      }
    },
    [loupeActive],
  );

  const onGridPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      const origin = holdOriginRef.current;
      const wasLoupe = loupeActive;
      clearHold();

      if (wasLoupe) {
        setLoupeActive(false);
        return;
      }

      if (!origin || didSelectRef.current) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (Math.hypot(dx, dy) > gesture.hysteresisPx) return;

      didSelectRef.current = true;
      onSelectIndex(origin.index);
      onOpenChange(false);
    },
    [loupeActive, onOpenChange, onSelectIndex],
  );

  const onGridPointerCancel = useCallback(() => {
    clearHold();
    setLoupeActive(false);
  }, []);

  const onContextMenu = useCallback((event: ReactPointerEvent | ReactMouseEvent) => {
    event.preventDefault();
  }, []);

  return (
    <LayoutGroup id="flipbook-sheet">
      {/* Local portal host so Motion layoutId stays in-tree */}
      <div ref={portalContainerRef} className="pointer-events-none fixed inset-0 z-[90]" />

      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          if (!next) setLoupeActive(false);
          onOpenChange(next);
        }}
        modal
      >
        <Dialog.Portal container={portalContainerRef}>
          <Dialog.Popup
            className={clsx(
              "contact-sheet-popup pointer-events-auto fixed inset-0 z-[91] flex flex-col outline-none",
              "bg-surface-sunk text-text-primary",
            )}
            style={{
              // Opacity transition required so Base UI getAnimations() waits on exit
              transition: dragging
                ? `opacity ${motionTokens.sheetMs}ms var(--ease-drawer)`
                : `opacity ${motionTokens.sheetMs}ms var(--ease-drawer), transform ${motionTokens.sheetMs}ms var(--ease-drawer)`,
              transform: offsetY ? `translate3d(0, ${offsetY}px, 0)` : undefined,
            }}
            render={(props) => (
              <motion.div {...(props as unknown as ComponentProps<typeof motion.div>)} />
            )}
          >
            <Dialog.Title className="sr-only">{album.title} contact sheet</Dialog.Title>
            <Dialog.Description className="sr-only">
              Browse frames and select a photo. Press and hold for the loupe.
            </Dialog.Description>

            <header
              className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]"
              {...dragHandlers}
              style={{ touchAction: "none" }}
            >
              <p className="type-title truncate">{album.title}</p>
              <Dialog.Close
                className="min-h-10 min-w-10 rounded-sm px-3 type-frame text-text-secondary transition-colors hover:text-text-primary"
                aria-label="Close contact sheet"
              >
                Close
              </Dialog.Close>
            </header>

            <div
              ref={sheetBodyRef}
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
              style={{ touchAction: loupeActive ? "none" : "pan-y" }}
              onPointerDown={onGridPointerDown}
              onPointerMove={onGridPointerMove}
              onPointerUp={onGridPointerUp}
              onPointerCancel={onGridPointerCancel}
              onContextMenu={onContextMenu}
            >
              <div className="mx-auto flex max-w-3xl gap-1">
                <Sprockets side="left" className="hidden w-3.5 shrink-0 text-text-tertiary sm:block" />

                <div className="grid min-w-0 flex-1 grid-cols-3 gap-x-2 gap-y-4 py-2">
                  <AnimatePresence>
                    {album.photos.map((photo, index) => {
                      const isCurrent = index === currentIndex;
                      return (
                        <motion.button
                          key={photo.id}
                          type="button"
                          className="group relative flex flex-col gap-1.5 text-left outline-none"
                          initial={{ opacity: 0, scale: motionTokens.enterScale }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: motionTokens.enterScale }}
                          transition={{
                            duration: motionTokens.sheetMs / 1000,
                            ease: ease.drawer,
                            delay: Math.min(index, 12) * 0.012,
                          }}
                          style={{ touchAction: "none", WebkitTouchCallout: "none" }}
                          aria-current={isCurrent ? "true" : undefined}
                          aria-label={`Frame ${frameLabel(index)}, ${photo.alt}`}
                          onClick={(e) => {
                            // Selection handled on pointerup to distinguish hold
                            e.preventDefault();
                          }}
                        >
                          <div
                            data-photo-index={index}
                            className="relative aspect-[4/3] w-full overflow-hidden bg-surface-recto"
                          >
                            <motion.div
                              layoutId={`print-${photo.id}`}
                              className="absolute inset-0 overflow-hidden"
                              transition={{
                                layout: {
                                  duration: motionTokens.sheetMs / 1000,
                                  ease: ease.drawer,
                                },
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.src}
                                alt=""
                                width={photo.width}
                                height={photo.height}
                                draggable={false}
                                className="mat-image h-full w-full object-cover"
                              />
                            </motion.div>
                            {isCurrent ? <Chinagraph photoId={photo.id} /> : null}
                          </div>
                          <span className="type-frame text-text-tertiary tabular-nums">
                            {frameLabel(index)}
                          </span>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>

                <Sprockets side="right" className="hidden w-3.5 shrink-0 text-text-tertiary sm:block" />
              </div>

              <Loupe
                photos={album.photos}
                containerRef={sheetBodyRef}
                active={loupeActive}
                pointerRef={pointerRef}
              />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <style>{`
        .contact-sheet-popup {
          opacity: 1;
        }
        .contact-sheet-popup[data-starting-style],
        .contact-sheet-popup[data-ending-style] {
          opacity: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .contact-sheet-popup {
            transition: none !important;
          }
        }
      `}</style>
    </LayoutGroup>
  );
}
