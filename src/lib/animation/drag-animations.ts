/**
 * @file drag-animations.ts
 *
 * Typed animation helpers for tile drag lifecycle: pick up, put down,
 * and reposition. Each returns a GSAP Tween so callers can chain or kill.
 */

import { gsap } from "./register";

const PICK_UP_SCALE = 1.08;
const PICK_UP_DURATION = 0.15;

const PUT_DOWN_DURATION = 0.2;

const REPOSITION_DURATION = 0.3;

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
    duration: PICK_UP_DURATION,
    ease: "power2.out",
  });
}

/**
 * Scales element back to rest and clears all inline GSAP styles on complete.
 * Use on successful drops where a React state change will re-render.
 *
 * @param element - The dragged tile element.
 * @returns A GSAP Tween for the put-down animation.
 */
export function animatePutDown(element: HTMLElement): gsap.core.Tween {
  return gsap.to(element, {
    scale: 1,
    duration: PUT_DOWN_DURATION,
    ease: "power2.out",
    clearProps: "all",
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
    duration: REPOSITION_DURATION,
    ease: "back.out(1.2)",
    clearProps: "all",
    ...(onComplete !== undefined && { onComplete }),
  });
}
