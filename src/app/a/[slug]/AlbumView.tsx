"use client";

/**
 * The two narrative rooms, and the switch between them (§1's mode table).
 *
 * Mobile gets Stack + contact sheet; desktop gets Book + light table. The
 * narrative component is the same in both — one `axis` prop, no fork (§4.5).
 * Browse is *not* the same component, and deliberately so: the sheet and the
 * light table are the same information in two rooms that work differently, and
 * porting either one to the other's platform is explicitly the wrong move
 * (§10).
 */

import { useEffect, useState } from "react";
import type { Album } from "@/fixtures/albums";
import { Flipbook } from "@/components/stage/Flipbook";
import { LightTable } from "@/components/desktop/LightTable";
import { hinge } from "@/design/tokens";

export function AlbumView({ album }: { album: Album }) {
  const [desktop, setDesktop] = useState(false);
  const [table, setTable] = useState(false);

  useEffect(() => {
    const mq = matchMedia(
      `(pointer: fine) and (min-width: ${hinge.bookModeMinWidth}px)`,
    );
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // `G` opens browse with no transition — it repeats hundreds of times and
  // animation makes it feel slow (§3.3). There is exactly one owner of the
  // key: Flipbook calls `onBrowse` when it has one, and toggles its own sheet
  // when it doesn't.
  return (
    <>
      <Flipbook
        album={album}
        onBrowse={desktop ? () => setTable((t) => !t) : undefined}
      />
      {desktop && table && <LightTable album={album} onClose={() => setTable(false)} />}
    </>
  );
}
