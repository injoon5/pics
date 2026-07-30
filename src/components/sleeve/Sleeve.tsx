"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { hash, mulberry32 } from "@/design/seed";
import { motion, sleeve } from "@/design/tokens";
import type { Album } from "@/fixtures/types";
import { cn } from "@/lib/cn";
import { StackPeek } from "./StackPeek";

export function Sleeve({ album }: { album: Album }) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const tiltRng = mulberry32(hash(`sleeve-tilt:${album.slug}`));
  const tilt = (tiltRng() - 0.5) * 2 * sleeve.sleeveTilt;

  const stamp =
    album.colophon ??
    `${album.photoCount} exp · lab · ${new Date().getFullYear()}`;

  const prefetch = useCallback(() => {
    router.prefetch(`/album/${album.slug}`);
  }, [router, album.slug]);

  const onPress = () => setPressed(true);
  const onRelease = () => setPressed(false);

  return (
    <Link
      href={`/album/${album.slug}`}
      className={cn(
        "sleeve group relative block w-full max-w-[280px] outline-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
      )}
      style={{
        transform: `rotate(${tilt}deg) scale(${pressed ? motion.pressScaleSurface : 1})`,
        transition: `transform ${motion.sleeveFlapMs}ms var(--ease-drawer)`,
      }}
      onPointerDown={() => {
        prefetch();
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      onPointerCancel={onRelease}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onPress();
      }}
      onKeyUp={onRelease}
      aria-label={`${album.title}. ${stamp}.`}
    >
      <div className="relative flex flex-col">
        <StackPeek
          photos={album.photos}
          albumSlug={album.slug}
          pressed={pressed}
        />

        {/* Paper wallet body + flap */}
        <div
          className={cn(
            "relative -mt-1 overflow-hidden rounded-[3px] bg-surface-recto",
            "shadow-[inset_0_0_0_1px_oklch(0_0_0/0.055),0_1px_0_oklch(1_0_0/0.55)]",
          )}
          style={{
            transform: pressed
              ? `perspective(600px) rotateX(-${sleeve.flapLiftDeg}deg)`
              : "perspective(600px) rotateX(0deg)",
            transformOrigin: "50% 0%",
            transition: `transform ${motion.sleeveFlapMs}ms var(--ease-drawer)`,
          }}
        >
          {/* Press highlight */}
          <div
            className="pointer-events-none absolute inset-0 z-10 transition-opacity"
            style={{
              opacity: pressed ? 1 : 0,
              transitionDuration: `${motion.pressMs}ms`,
              background:
                "linear-gradient(180deg, color-mix(in oklch, var(--color-accent) 8%, transparent), transparent 55%)",
            }}
          />

          <div className="paper-grain opacity-[0.04]" />

          <div className="relative flex flex-col gap-2 px-4 pb-4 pt-5">
            <p
              className="type-sleeve-label text-[0.9375rem] leading-snug"
              style={{
                transform: `rotate(${sleeve.labelRotate}deg)`,
                transformOrigin: "0% 50%",
              }}
            >
              {album.title}
            </p>
            {album.subtitle ? (
              <p className="type-note text-text-tertiary text-[0.8125rem]">
                {album.subtitle}
              </p>
            ) : null}
            <p className="type-lab-stamp mt-1 text-[0.75rem]">{stamp}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
