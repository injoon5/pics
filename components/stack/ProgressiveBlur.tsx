const LAYERS = 5;

/**
 * Progressive ("variable") blur: a stack of backdrop-filter layers whose radii
 * double each step, each masked to a band that starts higher than the last.
 * Where the bands overlap the blur accumulates, so the effect ramps smoothly
 * from heavy at the top edge to nothing at the bottom — a single
 * `backdrop-blur` can only ever produce a hard, uniform edge.
 */
export function ProgressiveBlur({
  height = "8rem",
  className = "",
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 ${className}`}
      style={{ height }}
    >
      {Array.from({ length: LAYERS }).map((_, i) => {
        const blur = 0.6 * 2 ** i;
        const end = ((LAYERS - i) / LAYERS) * 100;
        const start = Math.max(end - 100 / LAYERS, 0);
        const mask = `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${start}%, rgba(0,0,0,0) ${end}%)`;

        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}
