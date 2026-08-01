"use client";

/**
 * Releases the page transition that navigated here.
 *
 * The listing is a server component, and the handshake in `viewTransition.ts`
 * needs a mount signal from the destination — so this is the smallest possible
 * client island whose only job is to say "arrived". Without it the transition
 * would sit under its snapshot until the safety timeout fired, which looks
 * like a stall rather than a transition.
 */

import { useEffect } from "react";
import { finishRouteTransition } from "@/lib/viewTransition";

export function ArrivedOnListing() {
  useEffect(() => finishRouteTransition(), []);
  return null;
}
