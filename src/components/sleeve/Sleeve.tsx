"use client";

/**
 * §9 — an album is a paper photo wallet.
 *
 * Prints peeking out of the top at seeded angles, a wax-pencil label, a lab
 * stamp block, and a thickness that scales with the photo count. That last one
 * is the point of the whole component: big trips look big, and you know which
 * album is which before you read a word.
 *
 * The flap, the prints and the stamp are all hand-built. There is no library
 * for "photo wallet", and if there were, using it would be the wrong call.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Album } from "@/fixtures/albums";
import { Stack } from "@/components/stage/Stack";
import { sleeve as tokens, durations, cssEase, type as typeTokens } from "@/design/tokens";
import { jitter, seeded } from "@/lib/rng";
import { sources, fallbackSrc } from "@/lib/image";

export function Sleeve({ album }: { album: Album }) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const tilt = (jitter(album.slug, tokens.tiltDegrees * 2).dx / tokens.tiltDegrees) *
    tokens.tiltDegrees;
  const rnd = seeded(`${album.slug}:sleeve`);

  // Two or three prints, whichever the album can supply.
  const peeking = album.photos.slice(0, 3);

  return (
    <Link
      href={`/a/${album.slug}`}
      // Prefetch the album payload on pointerdown, so the sleeve→stack
      // transition has nothing to wait for (§9).
      onPointerDown={() => {
        setPressed(true);
        router.prefetch(`/a/${album.slug}`);
      }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="sleeve group block focus-visible:outline-none"
      style={{
        transform: `rotate(${tilt.toFixed(2)}deg) scale(${pressed ? tokens.pressScale : 1})`,
        transition: `transform ${durations.press}ms ${cssEase.out}`,
      }}
      aria-label={`${album.title}, ${album.photos.length} frames`}
    >
      <div className="relative">
        {/* Thickness. One node, N hairlines — the same stack that sits under
            the hinge, so a thick album feels like the same object here and
            there (§5.3). */}
        <Stack
          remaining={album.photos.length + 1}
          total={album.photos.length + 1}
          className="absolute inset-x-2 bottom-0 h-8"
        />

        {/* The prints, peeking. The layer is deliberately shorter than the
            prints it contains: the flap that follows in normal flow covers the
            rest, so the top one shows ~62% of its height and the others are
            progressively more buried. A print is 76% of the sleeve's width and
            4:3, so 62% of its height is 0.62 × 0.76 × 3/4 = 35.3% of the
            sleeve's width — expressed as padding, because percentage padding
            resolves against width and that is the only way to tie this height
            to the print's aspect ratio without measuring. */}
        <div className="relative mx-2" style={{ paddingBottom: "35.3%" }}>
          {peeking.map((photo, i) => {
            // Fanned around the centre rather than independently jittered: a
            // wallet's prints splay because they were pushed in as a group,
            // and three independently random angles read as three mistakes.
            const spread = (i - (peeking.length - 1) / 2) * tokens.printAngleDegrees;
            const angle = spread * 1.7 + (rnd() - 0.5) * tokens.printAngleDegrees;
            const depth = i / Math.max(peeking.length - 1, 1);
            return (
              <div
                key={photo.id}
                className="absolute left-1/2 top-0 w-[76%] bg-surface p-[3px]"
                style={{
                  borderRadius: "var(--radius-card)",
                  transform: `translateX(-50%) rotate(${angle.toFixed(2)}deg) translateY(${
                    (pressed ? -tokens.printRise : 0) + depth * 5
                  }px)`,
                  transition: `transform ${durations.flapLift}ms ${cssEase.drawer}`,
                  zIndex: peeking.length - i,
                  aspectRatio: "4 / 3",
                  boxShadow: "0 1px 2px oklch(0 0 0 / 0.16)",
                }}
              >
                <picture>
                  {sources(photo).map((s) => (
                    <source key={s.type} type={s.type} srcSet={s.srcSet} sizes="40vw" />
                  ))}
                  <img
                    src={fallbackSrc(photo)}
                    alt=""
                    className="h-full w-full rounded-[2px] object-cover"
                    decoding="async"
                    loading="lazy"
                  />
                </picture>
              </div>
            );
          })}
        </div>

        {/* The flap. Lifts ~6° on press — hinged at its own bottom edge, which
            is where a wallet flap is actually hinged. It sits above the prints
            in the stacking order, which is what buries them. */}
        <div
          className="relative rounded-b-[6px] bg-surface-sunk px-4 pb-4 pt-5"
          style={{
            // Above the prints, which is what buries them. Inline rather than a
            // utility because the prints carry inline z-indices too, and two
            // sources for one stacking order is how these get out of step.
            zIndex: 30,
            transformOrigin: "50% 100%",
            transform: `perspective(700px) rotateX(${pressed ? tokens.flapLiftDegrees : 0}deg)`,
            transition: `transform ${durations.flapLift}ms ${cssEase.drawer}`,
            boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.5), 0 1px 3px oklch(0 0 0 / 0.1)",
          }}
        >
          <h2
            className="m-0 text-[17px] text-accent"
            lang={album.lang}
            style={{
              fontVariationSettings: `"opsz" 14, "wght" ${typeTokens.sleeveLabel.wght}, "wdth" ${typeTokens.sleeveLabel.wdth}`,
              // A hand-written label is never quite on the baseline.
              transform: `rotate(${tokens.labelRotation}deg)`,
              transformOrigin: "0 50%",
            }}
          >
            {album.title}
          </h2>

          {/* The lab stamp: the same blue, faded, the way a rubber stamp
              fades. Not a second accent — the same one, worn. */}
          <p
            className="m-0 mt-2 text-[11px] tabular-nums text-china-700 opacity-70"
            style={{
              fontVariationSettings: `"opsz" 14, "wght" ${typeTokens.labStamp.wght}, "wdth" ${typeTokens.labStamp.wdth}`,
            }}
          >
            {album.stamp}
          </p>
        </div>
      </div>
    </Link>
  );
}
