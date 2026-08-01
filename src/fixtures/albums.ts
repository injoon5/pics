/**
 * The authored half of the fixtures: everything a studio would own (§11.3).
 * The measured half — EXIF, band means, thumbhashes — is generated into
 * `photos.ts` from the actual files.
 *
 * The shape mirrors the §11.1 Convex schema exactly, so phase 8 replaces the
 * import and nothing downstream changes.
 */

import { analyses, type Analysis } from "./photos";

export type Photo = Analysis & {
  id: string;
  albumSlug: string;
  /** Fractional index — dragging to reorder writes one row, not N (§11.1). */
  order: string;
  /** Required. Enforced before publish in the studio (§13). */
  alt: string;
  /** The handwritten note, printed on the back of the next card. */
  note?: string;
  location?: { label: string; lat?: number; lng?: number };
  /** §11.1 — GPS is stripped by default. Coordinates only on explicit opt-in. */
  showLocation: boolean;
};

export type Album = {
  slug: string;
  title: string;
  subtitle?: string;
  /** Printed on the back of card 1 — the first thing you see (§1). */
  intro: string;
  /** Printed in the empty sleeve at the end, with the sound toggle (§17). */
  colophon: string;
  /** BCP-47. Drives torph's `locale`; without it hangul mis-segments (§2.6). */
  lang: string;
  /** The lab stamp block on the sleeve (§9). */
  stamp: string;
  order: string;
  published: boolean;
  photos: Photo[];
};

const byBase = Object.fromEntries(analyses.map((a) => [a.base.slice(0, 8), a]));

/** Fractional indices, spaced so an insert between two neighbours is cheap. */
const idx = (n: number) => `a${String(n).padStart(2, "0")}`;

type Authored = {
  key: string;
  alt: string;
  note?: string;
  location?: Photo["location"];
  showLocation?: boolean;
};

function build(slug: string, authored: Authored[]): Photo[] {
  return authored.map((a, i) => {
    const analysis = byBase[a.key];
    if (!analysis) throw new Error(`No analysis for ${a.key} — run \`npm run fixtures\``);
    return {
      ...analysis,
      id: `${slug}-${a.key.toLowerCase()}`,
      albumSlug: slug,
      order: idx(i),
      alt: a.alt,
      note: a.note,
      location: a.location,
      showLocation: a.showLocation ?? false,
    };
  });
}

/* ── 여름 사이 ─────────────────────────────────────────────────────────────
   Four frames spanning a year, Korean notes. This is the album that exercises
   the CJK path: hangul body copy at wdth 100, and torph's `locale` in the
   loupe readout (§2.6). */

const summers: Album = {
  slug: "yeoreum-sai",
  title: "여름 사이",
  subtitle: "2025.07 — 2026.07",
  lang: "ko",
  stamp: "4 exp · 2025.07–2026.07",
  order: idx(0),
  published: true,
  intro:
    "필름 네 장. 2025년 여름에서 2026년 여름까지, 한 해를 사이에 두고 찍혔다. 아래에서 위로 넘기면 된다.",
  colophon: "여름 사이 · 4 exp · 2025.07–2026.07\nInterlude. 사진 외의 색은 없다.",
  photos: build("yeoreum-sai", [
    {
      key: "8C7ADF19",
      alt: "흐린 하늘 아래 완만한 초록 언덕 능선 위에 서 있는 커다란 나무 두 그루. 왼쪽 멀리 사람 한 명이 걸어간다.",
      note: "언덕 위에 나무 두 그루. 그날은 하루 종일 흐렸다.",
    },
    {
      key: "7A415A50",
      alt: "바다 위로 지는 해. 주황과 보라로 물든 구름, 오른쪽 언덕 위에 등대 실루엣, 수면에 작은 배 몇 척.",
      note: "해가 바다로 내려앉는 데 십 분쯤 걸렸다. 등대는 아직 켜지지 않았다.",
    },
    {
      key: "FEA65A2C",
      alt: "해질녘 반포대교에서 한강으로 물줄기가 쏟아지고, 강변 둔치에 돗자리를 편 사람들이 앉아 그것을 바라본다.",
      note: "다리에서 물이 쏟아지기 시작하자 사람들이 조용해졌다. 1초.",
      location: { label: "반포한강공원" },
      showLocation: true,
    },
    {
      key: "AD0590D4",
      alt: "높은 곳에서 내려다본 해질녘 서울. 한강이 도시를 가로지르고 다리 여러 개가 강을 건넌다. 지평선은 아직 주황색이다.",
      note: "강이 도시를 둘로 나눈다. 위에서 보면 그게 제일 먼저 보인다.",
      location: { label: "한강" },
    },
  ]),
};

/* ── Midtown, February ────────────────────────────────────────────────────
   Two frames three minutes apart. Short on purpose: the listing needs a thin
   sleeve next to a thick one, because §9's whole claim is that thickness
   scales with photo count and big trips look big. */

const midtown: Album = {
  slug: "midtown-february",
  title: "Midtown, February",
  subtitle: "Three minutes, two frames",
  lang: "en",
  stamp: "2 exp · New York · 2025.02",
  order: idx(1),
  published: true,
  intro:
    "Two frames, three minutes apart, over the same railing. The sun had already gone by the time I got the second one.",
  colophon:
    "Midtown, February · 2 exp · 2025.02\nSet in Interlude. The photographs are the only colour here.",
  photos: build("midtown-february", [
    {
      key: "E751B9B9",
      alt: "Silhouetted heads on an observation deck at dusk. One person holds a phone up; the lit spire of the Empire State Building sits in the gap between them, against an orange horizon.",
      note: "Everyone had the same idea. You can see the building through the gaps.",
    },
    {
      key: "0AC1BB00",
      alt: "The Manhattan skyline from above at dusk. The Empire State Building is lit in the centre, One World Trade Center behind it, the Hudson orange along the horizon.",
      note: "Three minutes later, over the heads.",
    },
  ]),
};

export const albums: Album[] = [summers, midtown];

export const albumBySlug = (slug: string) => albums.find((a) => a.slug === slug);

/** §11.5 — one query per album returns everything, ordered. */
export const publishedAlbums = () =>
  albums.filter((a) => a.published).sort((a, b) => a.order.localeCompare(b.order));
