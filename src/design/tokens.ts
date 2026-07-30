/** Every tunable number in the product. DialKit reads defaults from here. */

export const hinge = {
  ratio: 0.5,
  perspective: 1400,
  /** Desktop book mode breakpoint (px) + fine pointer */
  bookMinWidth: 900,
} as const;

export const card = {
  thickness: 1.6,
  radius: 4,
  matTop: 10,
  matSides: 10,
  matBottom: 22,
  imageRadius: 2,
  grainOpacity: 0.035,
} as const;

export const stack = {
  maxVisibleLayers: 7,
  layerGap: 1,
  jitterTranslate: 0.8,
  jitterRotate: 0.7,
  hairlineBaseAlpha: 0.5,
  hairlineAlphaStep: 0.06,
  restackStaggerMs: 18,
} as const;

export const flip = {
  /** cubic-bezier(0.34, 0.02, 0.18, 1) — slow off the mark */
  ease: [0.34, 0.02, 0.18, 1] as [number, number, number, number],
  settle: { visualDuration: 0.34, bounce: 0.12 },
  restack: { visualDuration: 0.4, bounce: 0.14 },
  sag: { visualDuration: 0.3, bounce: 0.18 },
  shadowLag: { visualDuration: 0.12, bounce: 0 },
  keyframeStops: 8,
} as const;

export const shadow = {
  contactPeakUntil: 0.15,
  castPeakAt: 0.5,
  maxChroma: 0.012,
} as const;

export const sheen = {
  peakFrom: 60,
  peakTo: 120,
  opacity: 0.18,
} as const;

export const blur = {
  radii: [0.5, 1.5, 4, 10] as const,
  /** mask stops as [start%, end%] per layer */
  masks: [
    [0, 30],
    [20, 55],
    [45, 78],
    [70, 100],
  ] as const,
  tintOpacity: 0.4,
  crossfadeBlurPx: 2,
} as const;

export const appearance = {
  darkThreshold: 0.42,
  themeColorMaxChroma: 0.02,
  themeColorLightnessSlack: 0.06,
  crossfadeMs: 240,
} as const;

export const motion = {
  pressMs: 140,
  chinagraphMs: 240,
  filmCounterMs: 120,
  sleeveFlapMs: 200,
  sheetMs: 280,
  chromeRailMs: 240,
  loupeRevealMs: 450,
  loupeDismissMs: 140,
  enterScale: 0.94,
  pressScaleControl: 0.96,
  pressScaleSurface: 0.98,
  hoverLiftPx: 2,
  staggerMs: [30, 80] as const,
} as const;

export const ease = {
  out: [0.23, 1, 0.32, 1] as [number, number, number, number],
  inOut: [0.77, 0, 0.175, 1] as [number, number, number, number],
  drawer: [0.32, 0.72, 0, 1] as [number, number, number, number],
  flip: [0.34, 0.02, 0.18, 1] as [number, number, number, number],
} as const;

export const gesture = {
  decelerationRate: 0.998,
  rubberbandConstant: 0.55,
  hysteresisPx: 10,
  sheetOpenThresholdPx: 88,
  sheetRubberbandStartPx: 60,
  dismissVelocity: 0.11,
  soundRateLimitMs: 90,
} as const;

export const chrome = {
  safariBarExpandedPt: 56,
  safariBarCollapsedPt: 44,
  railDurationMs: 240,
  minHitArea: 40,
} as const;

export const radii = {
  card: 4,
  image: 2,
} as const;

export const type = {
  albumTitle: { opsz: 32, wght: 500, wdth: 100 },
  note: { opsz: 14, wght: 400, wdth: 100, leading: 1.55 },
  exif: { opsz: 14, wght: 450, wdth: 88, tracking: "0.02em" },
  frame: { opsz: 14, wght: 600, wdth: 82 },
  intro: { opsz: 32, wght: 380, wdth: 96 },
  sleeveLabel: { opsz: 14, wght: 500, wdth: 92 },
  labStamp: { opsz: 14, wght: 450, wdth: 84 },
} as const;

export const sleeve = {
  peekCount: 3,
  peekAngle: 2.4,
  topPeekHeight: 0.62,
  sleeveTilt: 0.8,
  flapLiftDeg: 6,
  printSlidePx: 3,
  labelRotate: -0.4,
  stampOpacity: 0.7,
} as const;

export const loupe = {
  magnification: 2.5,
  morphEase: { stiffness: 200, damping: 26 },
} as const;

export const sound = {
  maxGain: 0.1,
  rateLimitMs: 90,
  visualSyncMs: 30,
} as const;

export const performance = {
  mountedCards: 4,
  maxBlurLayers: 4,
  jsPerFrameMs: 4,
} as const;
