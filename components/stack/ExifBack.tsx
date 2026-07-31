import NumberFlow from "@number-flow/react";
import type { Photo } from "@/lib/types";

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The written side of a print. `compact` is the version that has to live inside
 * a card in the pile; the full version is for the desktop rail.
 */
export function ExifBack({
  photo,
  compact = false,
}: {
  photo: Photo;
  compact?: boolean;
}) {
  const { exif } = photo;
  const date = formatDate(exif?.takenAt ?? null);

  if (compact) {
    const stats = [
      exif?.focalLength ? `${exif.focalLength}mm` : null,
      exif?.aperture ? `ƒ/${exif.aperture}` : null,
      exif?.shutter,
      exif?.iso ? `ISO ${exif.iso}` : null,
    ].filter(Boolean);

    return (
      <div className="flex h-full w-full flex-col gap-3 p-5">
        <div className="min-h-0 flex-1 overflow-hidden">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {photo.title}
          </h2>
          {date ? (
            <p className="mt-0.5 text-sm text-neutral-400 dark:text-neutral-600">
              {date}
            </p>
          ) : null}
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {photo.note}
          </p>
        </div>

        {exif ? (
          <div className="shrink-0">
            {exif.model ? (
              <p className="truncate text-sm text-neutral-400 dark:text-neutral-600">
                {exif.model}
              </p>
            ) : null}
            <p className="tabular-nums mt-0.5 line-clamp-2 text-sm text-neutral-800 dark:text-neutral-200">
              {stats.join(" · ")}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between p-6 sm:p-7">
      <div>
        <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {photo.title}
        </h2>
        {date ? <p className="mt-0.5 text-sm text-neutral-500">{date}</p> : null}
        <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {photo.note}
        </p>
      </div>

      {exif ? (
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <dt className="text-sm text-neutral-400 dark:text-neutral-600">
              Camera
            </dt>
            <dd className="mt-0.5 text-sm text-neutral-800 dark:text-neutral-200">
              {exif.model ?? "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-sm text-neutral-400 dark:text-neutral-600">
              Lens
            </dt>
            <dd className="mt-0.5 truncate text-sm text-neutral-800 dark:text-neutral-200">
              {exif.lens ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-400 dark:text-neutral-600">
              Focal length
            </dt>
            <dd className="tabular-nums mt-0.5 text-sm text-neutral-800 dark:text-neutral-200">
              {exif.focalLength ? (
                <>
                  <NumberFlow value={exif.focalLength} />mm
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-400 dark:text-neutral-600">
              Aperture
            </dt>
            <dd className="tabular-nums mt-0.5 text-sm text-neutral-800 dark:text-neutral-200">
              {exif.aperture ? (
                <>
                  ƒ/<NumberFlow value={exif.aperture} />
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-400 dark:text-neutral-600">
              Shutter
            </dt>
            <dd className="tabular-nums mt-0.5 text-sm text-neutral-800 dark:text-neutral-200">
              {exif.shutter ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-400 dark:text-neutral-600">
              ISO
            </dt>
            <dd className="tabular-nums mt-0.5 text-sm text-neutral-800 dark:text-neutral-200">
              {exif.iso ? <NumberFlow value={exif.iso} /> : "—"}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
