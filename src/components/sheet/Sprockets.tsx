"use client";

/** SVG strip of film sprocket holes for contact-sheet gutters. */
export function Sprockets({
  side,
  className,
}: {
  side: "left" | "right";
  className?: string;
}) {
  const holes = Array.from({ length: 24 }, (_, i) => i);

  return (
    <svg
      aria-hidden
      className={className}
      width="14"
      height="100%"
      viewBox="0 0 14 480"
      preserveAspectRatio="none"
      data-side={side}
    >
      {holes.map((i) => {
        const y = 8 + i * 20;
        return (
          <rect
            key={i}
            x={side === "left" ? 3 : 4}
            y={y}
            width={7}
            height={10}
            rx={1.5}
            fill="currentColor"
            opacity={0.22}
          />
        );
      })}
    </svg>
  );
}
