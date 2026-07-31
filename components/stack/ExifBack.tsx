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

export function ExifBack({ photo }: { photo: Photo }) {
  const { exif } = photo;

  return (
    <div className="flex h-full w-full flex-col justify-between p-6 sm:p-7">
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {photo.slug.replaceAll("-", " ")}
        </p>
        {formatDate(exif?.takenAt ?? null) ? (
          <p className="mt-0.5 text-sm text-neutral-500">
            {formatDate(exif?.takenAt ?? null)}
          </p>
        ) : null}
        <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {photo.note}
        </p>
      </div>

      {exif ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <dt className="text-sm text-neutral-400 dark:text-neutral-600">
              Camera
            </dt>
            <dd className="mt-0.5 text-sm text-neutral-800 dark:text-neutral-200">
              {exif.model ?? "—"}
            </dd>
          </div>
          <div>
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
