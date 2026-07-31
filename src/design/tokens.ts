/**
 * Every tunable number in the product (§0.4).
 *
 * DialKit reads its defaults from here (§14). Nothing in `src/` may inline a
 * magic number that belongs in this file — if you find yourself typing a
 * literal into a component, it goes here first.
 *
 * When a dial is tuned on device, write the value back into this file in the
 * same session (§14). DialKit persists to localStorage, which means an untuned
 * build for everyone else.
 */

export type Axis = "x" | "y";

/** The horizontal (mobile) / vertical (desktop) split. §1, §4.3 */
export const hinge = {
  /** Fraction of the frozen viewport height at which the pad is hinged. */
  ratio: 0.5 as number,
  /** Hit area for the grabber and the sheet handle. §7.5 */
  hitSize: 40,
  /** Desktop book mode kicks in at this width with a fine pointer. §4.5 */
  bookModeMinWidth: 900,
} as const;

/** The card itself. §5.1, §5.2, §3.5 */
export const card = {
  /** Paper thickness in px. Above ~3 it reads as cardstock, not photo paper. */
  thickness: 1.6,
  /** Concentric radii: card → mat → image. §3.5 */
  radius: 4,
  imageRadius: 2,
  /** The mat the image is inset into. Wider at the bottom, as prints are. */
  matTop: 10,
  matSide: 10,
  matBottom: 22,
  /** Tiling paper-fibre texture. §5.2 */
  grainOpacity: 0.035,
  /** Inner cut-edge line and the outer half-pixel specular. §5.2 */
  edgeInnerAlpha: 0.055,
  edgeOuterAlpha: 0.6,
  /** Image outline — pure black / pure white only, never tinted. §5.2 */
  imageOutlineAlpha: 0.1,
} as const;

/** The flip curve. Deliberately slow off the mark — paper has to break away. §3.3A */
export const flip = {
  ease: [0.34, 0.02, 0.18, 1] as [number, number, number, number],
  /** Sampled stops emitted into the scroll-timeline @keyframes. §4.1 */
  keyframeStops: 8,
  /** Degrees of rotation for a complete flip. Positive: the card is hinged
   *  at its top edge, so a positive rotateX lifts its bottom edge toward the
   *  viewer and over — a page turning off a pad. A negative one swings it
   *  behind the screen plane, where the print it is landing on occludes it. */
  degrees: 180,
} as const;

/** The unflipped pile beneath the hinge. §5.3 */
export const stack = {
  /** Beyond 7 the eye stops counting; a terminal line stands in for the rest. */
  maxLayers: 7,
  layerGap: 2,
  hairlineAlpha: 0.5,
  hairlineAlphaStep: 0.06,
  /** Deterministic jitter, seeded per photo id. ±half of each value. */
  jitterX: 0.8,
  jitterRotation: 0.7,
  /** The staggered restack after a contact-sheet select. §8 */
  restackStagger: 18,
  /** How much shorter the cards are than their pane, so the pile's edges have
   *  somewhere to show. Without it the hairlines are drawn past the screen
   *  edge and the whole stack is an invisible no-op — you cannot feel how much
   *  album is left, which is the one thing §5.3 asks the pile to do. */
  peek: 20,
} as const;

/** Two shadows, both lagging the rotation. §5.4 */
export const shadow = {
  /** Perceptible as weight, imperceptible as lag. */
  lagSeconds: 0.12,
  contact: { blur: 10, spread: -4, alpha: 0.3, deadAt: 0.15 },
  cast: { blurMax: 44, offsetMax: 26, alpha: 0.22 },
  /** Photo-derived hue only, chroma clamped hard. §3.1 */
  tintChromaMax: 0.012,
} as const;

/** The light band sweeping the face as it passes through vertical. §5.5 */
export const sheen = {
  peakDegrees: 90,
  spreadDegrees: 30,
  alpha: 0.16,
  widthPercent: 42,
} as const;

/** Progressive blur — four layers on iOS, not six. §6.3 */
export const blur = {
  radii: [0.5, 1.5, 4, 10] as const,
  /** Mask stops as [from%, to%] per layer, deliberately overlapping. */
  stops: [
    [0, 30],
    [20, 55],
    [45, 78],
    [70, 100],
  ] as const,
  /** Band-mean tint sitting under the blur layers. Dialled back from 0.4:
   *  over a print that reads as haze on the photograph rather than as the
   *  light in the room, which is the only job photo colour has here (§3.1). */
  tintAlpha: 0.28,
  /** Height of the blur field at each edge, as a fraction of the half-pane.
   *  Small on purpose: this is an edge dissolve, not a fog bank. At a third of
   *  the pane it eats the top of the print and the whole caption, and the
   *  bottom band would be blurring the very text it sits over. */
  topExtent: 0.17,
  bottomExtent: 0.13,
  /** Anything above this is expensive, especially in Safari. §3.3 */
  maskingBlurMax: 20,
  /** Chroma ceiling for the band tint. Looser than the shadow's 0.012 because
   *  this wash sits directly under the photograph's own edge and has to match
   *  it; tight enough that it can never read as a second accent (§3.1). */
  tintChromaMax: 0.05,
} as const;

/** §3.4. The three formulas are in lib/gesture.ts; these are their constants. */
export const gesture = {
  /** Apple's exponential-decay projection rate. */
  decelerationRate: 0.998,
  /** Dismissal is velocity-based: px per ms. No distance threshold. */
  dismissVelocity: 0.11,
  /** Rubber-band constant. */
  rubberband: 0.55,
  /** Direction lock before tracking 1:1. */
  hysteresis: 10,
  /** Drag the hinge down past this to open the contact sheet. §8 */
  sheetOpenThreshold: 88,
  /** Resistance begins here. */
  sheetResistFrom: 60,
  /** Pinch-out scale that opens the sheet. */
  pinchOpenScale: 1.18,
} as const;

/** Timed motion. Everything here is under 300ms except the loupe reveal. §3.3B */
export const durations = {
  press: 140,
  markDraw: 240,
  counterTick: 120,
  flapLift: 200,
  sheetToggle: 280,
  /** Tracking system chrome. No spring, no bounce. §7.2 */
  rail: 240,
  appearanceCrossfade: 240,
  /** Asymmetric on purpose: the user is deciding, then the system responds. §3.3 */
  loupeReveal: 450,
  loupeDismiss: 140,
  /** Decorative only, never blocking. */
  staggerMin: 30,
  staggerMax: 80,
  /** Morph duration for the loupe readout / studio status line. §2.6 */
  morph: 260,
} as const;

/** Springs only where physics is being simulated. Bounce stays in 0.1–0.2. §3.3 */
export const springs = {
  flipSettle: { type: "spring", visualDuration: 0.34, bounce: 0.12 },
  restack: { type: "spring", visualDuration: 0.4, bounce: 0.14 },
  sag: { type: "spring", visualDuration: 0.3, bounce: 0.18 },
  /** The shadow lag. Zero bounce — shadows do not overshoot. */
  shadowLag: { type: "spring", visualDuration: shadow.lagSeconds, bounce: 0 },
  /** Cursor-following on the light table. §10 */
  cursor: { type: "spring", visualDuration: 0.22, bounce: 0.1 },
} as const;

export const easings = {
  /** Scrubbed. The user is the clock, so ease-in is legitimate here. §3.3A */
  flip: flip.ease,
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
} as const;

/** The same curves as mutable tuples, which is the shape Motion's `ease` takes. */
export const motionEase = {
  flip: [...easings.flip] as [number, number, number, number],
  out: [...easings.out] as [number, number, number, number],
  inOut: [...easings.inOut] as [number, number, number, number],
  drawer: [...easings.drawer] as [number, number, number, number],
} as const;

export const cssEase = {
  flip: `cubic-bezier(${easings.flip.join(", ")})`,
  out: `cubic-bezier(${easings.out.join(", ")})`,
  inOut: `cubic-bezier(${easings.inOut.join(", ")})`,
  drawer: `cubic-bezier(${easings.drawer.join(", ")})`,
} as const;

/** Appearance derives from the photograph, never from a user preference. §6.2 */
export const appearance = {
  darkThreshold: 0.42,
  /** theme-color is clamped hard so it reads as the room warming. §3.1 */
  themeColorChromaMax: 0.02,
  themeColorLightnessDelta: 0.06,
} as const;

/** The paper wallet in the album listing. §9 */
export const sleeve = {
  tiltDegrees: 0.8,
  printAngleDegrees: 2.4,
  /** How much of the top print shows above the flap. */
  peek: 0.62,
  flapLiftDegrees: 6,
  printRise: 3,
  /** Large surfaces get less scale than buttons — same absolute displacement. §7.5 */
  pressScale: 0.98,
  labelRotation: -0.4,
} as const;

/** §8. Glass, not paper — the one instrument surface in the product. */
export const loupe = {
  magnification: 2.5,
  diameter: 132,
  glassEdgeAlpha: 0.34,
  specularAlpha: 0.55,
} as const;

/** §8 */
export const sheet = {
  columns: 3,
  gutter: 26,
  gap: 10,
  thumbEnterScale: 0.94,
  /** The chinagraph circle. Seeded, non-circular, one visible overshoot. */
  markStrokeWidth: 2.2,
  markOvershoot: 0.16,
} as const;

/** §7.5 */
export const desktop = {
  hoverLift: 2,
  buttonPressScale: 0.96,
  surfacePressScale: 0.98,
  /** A coarse wheel notch is one flip; a trackpad stays continuous. */
  wheelNotchThreshold: 40,
  wheelCoarseSamples: 6,
  /** The one ambient effect in the build. §10 */
  lightTableIdleMs: 20_000,
} as const;

/** §7.6. Nothing exceeds 0.10. */
export const sound = {
  /** One flip sound per settle, not per card crossed. */
  rateLimitMs: 90,
  /** Sound must land within 30ms of its visual event. */
  maxLatencyMs: 30,
  /** Release velocity maps into this gain/filter range. */
  velocityGainRange: [0.6, 1.4] as const,
  velocityPeakRange: [0.75, 1.6] as const,
} as const;

/** §3.2. opsz / wght / wdth per role. */
export const type = {
  albumTitle: { opsz: 32, wght: 500, wdth: 100 },
  body: { opsz: 14, wght: 400, wdth: 100 },
  exif: { opsz: 14, wght: 450, wdth: 88 },
  frameNumber: { opsz: 14, wght: 600, wdth: 82 },
  intro: { opsz: 32, wght: 380, wdth: 96 },
  sleeveLabel: { opsz: 14, wght: 500, wdth: 92 },
  labStamp: { opsz: 14, wght: 500, wdth: 84 },
} as const;

/** §12 */
export const budget = {
  /** Cards mounted at any time: i, i+1, i+2. */
  mountedCards: 3,
  /** Decode this many cards ahead before they can enter view. §7.4 */
  decodeAhead: 2,
} as const;
