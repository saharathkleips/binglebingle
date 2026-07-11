/**
 * @file drag-animations.ts
 *
 * Typed animation helpers for direct tile drag lifecycle feedback: pick up and
 * reposition. Each returns a GSAP Tween so callers can chain or kill.
 */

import {
  MOTION_DURATION_PICK_UP,
  MOTION_EASE_STANDARD_OUT,
  SNAP_BACK_ANIMATION,
} from "./motion-tokens";
import { gsap } from "./register";

const PICK_UP_SCALE = 1.08;

/**
 * Scales element up on drag start. Box-shadow is left to CSS — GSAP never
 * overrides it so the tile's styled shadow stays consistent throughout the drag.
 *
 * @param element - The dragged tile element.
 * @returns A GSAP Tween for the pick-up animation.
 */
export function animatePickUp(element: HTMLElement): gsap.core.Tween {
  return gsap.to(element, {
    scale: PICK_UP_SCALE,
    duration: MOTION_DURATION_PICK_UP,
    ease: MOTION_EASE_STANDARD_OUT,
  });
}

/**
 * Snaps element back to its origin position (x:0, y:0) after a failed drop.
 * Clears all inline GSAP props on complete so the tile is fully reset.
 *
 * @param element - The dragged tile element.
 * @param onComplete - Optional callback fired when the animation finishes.
 * @returns A GSAP Tween for the snap-back animation.
 */
export function animateReposition(element: HTMLElement, onComplete?: () => void): gsap.core.Tween {
  return gsap.to(element, {
    x: 0,
    y: 0,
    scale: 1,
    ...SNAP_BACK_ANIMATION,
    clearProps: "all",
    ...(onComplete !== undefined && { onComplete }),
  });
}
