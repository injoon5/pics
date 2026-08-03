import {
  blur,
  card,
  chrome,
  flip,
  gesture,
  hinge,
  sheen,
  stack,
} from "./tokens";

type DialTuple = [number, number, number];

type DialValue = DialTuple | DialConfig | number | boolean | object;
interface DialConfig {
  [key: string]: DialValue;
}

function flatten(config: DialConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (Array.isArray(value) && value.length >= 3 && typeof value[0] === "number") {
      out[key] = value[0];
    } else if (value && typeof value === "object" && !Array.isArray(value) && !("type" in value)) {
      out[key] = flatten(value as DialConfig);
    } else if (value && typeof value === "object" && "type" in value) {
      out[key] = value;
    } else {
      out[key] = value;
    }
  }
  return out;
}

type UseDials = (name: string, config: DialConfig, options?: object) => Record<string, unknown>;

export const useDials: UseDials =
  process.env.NODE_ENV === "development"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require("dialkit").useDialKit as UseDials)
    : (_name, config) => flatten(config);

export const dialDefaults = {
  Hinge: {
    ratio: [hinge.ratio, 0.35, 0.65] as DialTuple,
    perspective: [hinge.perspective, 600, 2400] as DialTuple,
  },
  Card: {
    thickness: [card.thickness, 0.5, 4] as DialTuple,
    grainOpacity: [card.grainOpacity, 0, 0.12] as DialTuple,
    flipEase: {
      x1: [flip.ease[0], 0, 1] as DialTuple,
      y1: [flip.ease[1], -0.5, 1.5] as DialTuple,
      x2: [flip.ease[2], 0, 1] as DialTuple,
      y2: [flip.ease[3], -0.5, 1.5] as DialTuple,
    },
    settle: { type: "spring" as const, ...flip.settle },
  },
  Stack: {
    layers: [stack.maxVisibleLayers, 3, 12] as DialTuple,
    gap: [stack.layerGap, 0.5, 3] as DialTuple,
    jitterT: [stack.jitterTranslate, 0, 2] as DialTuple,
    jitterR: [stack.jitterRotate, 0, 2] as DialTuple,
    hairlineAlpha: [stack.hairlineBaseAlpha, 0.1, 0.9] as DialTuple,
  },
  Shadow: {
    lag: [flip.shadowLag.visualDuration, 0, 0.4] as DialTuple,
  },
  Sheen: {
    opacity: [sheen.opacity, 0, 0.5] as DialTuple,
  },
  Blur: {
    r0: [blur.radii[0], 0, 4] as DialTuple,
    r1: [blur.radii[1], 0, 8] as DialTuple,
    r2: [blur.radii[2], 0, 16] as DialTuple,
    r3: [blur.radii[3], 0, 24] as DialTuple,
  },
  Gesture: {
    decelerationRate: [gesture.decelerationRate, 0.98, 0.999] as DialTuple,
    dismissVelocity: [gesture.dismissVelocity, 0.05, 0.3] as DialTuple,
    rubberband: [gesture.rubberbandConstant, 0.2, 1] as DialTuple,
    hysteresis: [gesture.hysteresisPx, 4, 24] as DialTuple,
  },
  Chrome: {
    railMs: [chrome.railDurationMs, 100, 500] as DialTuple,
  },
} as const;
