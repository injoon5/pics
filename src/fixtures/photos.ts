import type { Album, Photo } from "./types";

const F = "/fixtures";

const base: Omit<Photo, "id" | "note" | "exif">[] = [
  {
    src: `${F}/0AC1BB00-8C93-4F82-9C83-33436BC20098_1_105_c.jpeg`,
    width: 1024,
    height: 768,
    alt: "Night aerial view of Midtown Manhattan with the lit Empire State Building against a deep blue sky and orange sunset band.",
    palette: {
      topBand: "oklch(0.37 0.03 263)",
      bottomBand: "oklch(0.28 0.03 76)",
      shadowHue: 255,
      meanL: 0.4,
    },
    location: { label: "Midtown Manhattan, New York" },
    showLocation: false,
  },
  {
    src: `${F}/7A415A50-CA9E-4FCD-939C-C288399514AD_1_105_c.jpeg`,
    width: 1024,
    height: 768,
    alt: "Sunset over the sea with a silhouetted lighthouse and trees on a coastal hill against pink and orange sky.",
    palette: {
      topBand: "oklch(0.55 0.02 315)",
      bottomBand: "oklch(0.16 0.01 20)",
      shadowHue: 260,
      meanL: 0.55,
    },
    location: { label: "Sokcho, Gangwon-do" },
    showLocation: false,
  },
  {
    src: `${F}/8C7ADF19-6C90-49C8-B0CD-FB07C1163C0F_1_105_c.jpeg`,
    width: 1024,
    height: 768,
    alt: "Wide green hillside under heavy overcast sky with two dark leafy trees on the ridge line.",
    palette: {
      topBand: "oklch(0.69 0.02 255)",
      bottomBand: "oklch(0.28 0.07 127)",
      shadowHue: 145,
      meanL: 0.57,
    },
    location: { label: "Seoul metro edge" },
    showLocation: false,
  },
  {
    src: `${F}/AD0590D4-82B3-43B3-ADED-564AC1E2DA56_1_105_c.jpeg`,
    width: 1024,
    height: 768,
    alt: "High twilight view down the Han River with lit bridges and city lights under a blue-to-orange sky.",
    palette: {
      topBand: "oklch(0.55 0.09 254)",
      bottomBand: "oklch(0.22 0.01 300)",
      shadowHue: 255,
      meanL: 0.49,
    },
    location: { label: "Seoul, Han River" },
    showLocation: false,
  },
  {
    src: `${F}/E751B9B9-54AA-4A27-883C-40FB02777A0A_1_105_c.jpeg`,
    width: 768,
    height: 1024,
    alt: "Silhouetted visitors on a glass observation deck framing the lit Empire State Building at sunset.",
    palette: {
      topBand: "oklch(0.34 0.02 279)",
      bottomBand: "oklch(0.10 0.02 354)",
      shadowHue: 40,
      meanL: 0.35,
    },
    location: { label: "Midtown Manhattan observation deck" },
    showLocation: false,
  },
  {
    src: `${F}/FEA65A2C-108D-4AFC-A148-2AD38E2EDDC2_1_105_c.jpeg`,
    width: 1024,
    height: 768,
    alt: "Night crowd watching Banpo Bridge’s pink-lit Moonlight Rainbow Fountain spray into the Han River.",
    palette: {
      topBand: "oklch(0.34 0.03 254)",
      bottomBand: "oklch(0.23 0.01 123)",
      shadowHue: 250,
      meanL: 0.29,
    },
    location: { label: "Banpo Hangang Park, Seoul" },
    showLocation: false,
  },
];

const passA: Array<{ note: string; exif: Photo["exif"] }> = [
  {
    note: "Midtown from ~265 m. Horizon clipped warm; shadow detail held at ISO 400.",
    exif: {
      camera: "Apple iPhone 11 Pro",
      lens: "iPhone 11 Pro back camera 6mm f/2",
      focal: 52,
      aperture: 2,
      shutter: "1/20",
      iso: 400,
      takenAt: Date.parse("2025-02-01T17:50:35"),
    },
  },
  {
    note: "속초 해안 일몰. 등대 실루엣. 상단 하늘이 평균 밝기를 올림.",
    exif: {
      camera: "Apple iPhone 11 Pro",
      lens: "iPhone 11 Pro back camera 6mm f/2",
      focal: 52,
      aperture: 2,
      shutter: "1/125",
      iso: 125,
      takenAt: Date.parse("2025-08-16T05:24:01"),
    },
  },
  {
    note: "Overcast ridge. Metered for grass; sky sits ~L 0.7.",
    exif: {
      camera: "Apple iPhone 11 Pro",
      lens: "iPhone 11 Pro back camera 6mm f/2",
      focal: 52,
      aperture: 2,
      shutter: "1/2800",
      iso: 25,
      takenAt: Date.parse("2025-07-05T14:42:57"),
    },
  },
  {
    note: "한강 야경. 고도 ~520 m. 강면 반사 약간 눌림.",
    exif: {
      camera: "Apple iPhone 15 Pro Max",
      lens: "iPhone 15 Pro Max back camera 6.765mm f/1.78",
      focal: 24,
      aperture: 1.8,
      shutter: "1/50",
      iso: 800,
      takenAt: Date.parse("2026-07-11T20:23:21"),
    },
  },
  {
    note: "Glass deck. Bias −0.9 EV. Foreground crushed; spire held.",
    exif: {
      camera: "Apple iPhone 11 Pro",
      lens: "iPhone 11 Pro back camera 6mm f/2",
      focal: 52,
      aperture: 2,
      shutter: "1/25",
      iso: 500,
      takenAt: Date.parse("2025-02-01T17:47:34"),
    },
  },
  {
    note: "반포 달빛무지개분수. 1 s 노출. 전경 관객 움직임 있음.",
    exif: {
      camera: "Apple iPhone 17",
      lens: "iPhone 17 back camera 5.96mm f/1.6",
      focal: 26,
      aperture: 1.6,
      shutter: "1",
      iso: 32,
      takenAt: Date.parse("2026-05-02T19:43:40"),
    },
  },
];

const passB: Array<{ note: string; exif: Photo["exif"] }> = [
  {
    note: "Retake window. Crane left of frame; check construction flare.",
    exif: {
      camera: "Fujifilm X-T5",
      lens: "XF 23mm F2 R WR",
      focal: 23,
      aperture: 4,
      shutter: "1/15",
      iso: 1600,
      takenAt: Date.parse("2025-02-01T17:52:10"),
    },
  },
  {
    note: "Second pass. Horizon haze; boat lights on water counted as noise.",
    exif: {
      camera: "Sony α7 IV",
      lens: "FE 35mm F1.8",
      focal: 35,
      aperture: 8,
      shutter: "1/100",
      iso: 200,
      takenAt: Date.parse("2025-08-16T05:26:40"),
    },
  },
  {
    note: "능선 두 그루. 인물 실루엣 좌측. 흐림 유지.",
    exif: {
      camera: "Ricoh GR IIIx",
      lens: "GR Lens 26.1mm F2.8",
      focal: 40,
      aperture: 5.6,
      shutter: "1/500",
      iso: 200,
      takenAt: Date.parse("2025-07-05T14:45:12"),
    },
  },
  {
    note: "Wide bridge count. Atmospheric haze on far mountains.",
    exif: {
      camera: "Leica Q3",
      lens: "Summilux 28mm f/1.7 ASPH.",
      focal: 28,
      aperture: 2.8,
      shutter: "1/30",
      iso: 640,
      takenAt: Date.parse("2026-07-11T20:25:00"),
    },
  },
  {
    note: "엠파이어 스테이트 실루엣. 유리 반사 최소. 세로 프레임 유지.",
    exif: {
      camera: "Canon EOS R6 II",
      lens: "RF 50mm F1.8 STM",
      focal: 50,
      aperture: 2.8,
      shutter: "1/60",
      iso: 800,
      takenAt: Date.parse("2025-02-01T17:49:02"),
    },
  },
  {
    note: "Flooding-warning sign left. Pink wash on jets; crowd density high.",
    exif: {
      camera: "Nikon Z6 II",
      lens: "NIKKOR Z 24mm f/1.8 S",
      focal: 24,
      aperture: 2,
      shutter: "1/8",
      iso: 1600,
      takenAt: Date.parse("2026-05-02T19:46:18"),
    },
  },
];

const idsA = [
  "nyc-midtown-dusk",
  "sokcho-lighthouse-sunset",
  "ridge-two-trees",
  "seoul-han-twilight",
  "esb-deck-silhouettes",
  "banpo-moonlight-fountain",
] as const;

export const photos: Photo[] = base.flatMap((photo, i) => {
  const a = passA[i]!;
  const b = passB[i]!;
  const id = idsA[i]!;
  return [
    { ...photo, id, note: a.note, exif: a.exif },
    { ...photo, id: `${id}-b`, note: b.note, exif: b.exif },
  ];
});

/** Ordered narrative roll — 12 frames cycling the 6 source files. */
export const rollPhotos: Photo[] = [
  photos[0]!,
  photos[2]!,
  photos[4]!,
  photos[6]!,
  photos[8]!,
  photos[10]!,
  photos[1]!,
  photos[3]!,
  photos[5]!,
  photos[7]!,
  photos[9]!,
  photos[11]!,
];

export const albums: Album[] = [
  {
    slug: "east-coast-roll",
    title: "East coast roll",
    subtitle: "New York · Sokcho · Seoul",
    intro:
      "Twelve frames from a short trip. Flip from the hinge. Captions live on the verso of each print.",
    colophon: "36 exp · mixed bodies · 2025–2026",
    lang: "ko",
    coverPhotoId: rollPhotos[0]!.id,
    photoCount: rollPhotos.length,
    published: true,
    photos: rollPhotos,
  },
  {
    slug: "han-after-dark",
    title: "Han after dark",
    subtitle: "Seoul river night",
    intro: "Bridge lights and fountain spray. A short sleeve from the river.",
    colophon: "6 exp · Seoul · 2026",
    lang: "ko",
    coverPhotoId: photos[6]!.id,
    photoCount: 6,
    published: true,
    photos: [photos[6]!, photos[10]!, photos[7]!, photos[11]!, photos[4]!, photos[5]!],
  },
];

export function getAlbum(slug: string): Album | undefined {
  return albums.find((a) => a.slug === slug);
}
