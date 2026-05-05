/**
 * @file drag-animations.ts
 *
 * Typed animation helpers for tile drag lifecycle: pick up, put down,
 * and reposition. Each returns a GSAP Tween so callers can chain or kill.
 */

import { gsap } from "./register";

const PICK_UP_SCALE = 1.08;
const PICK_UP_SHADOW = "4px 8px 16px rgba(0, 0, 0, 0.25)";
const PICK_UP_DURATION = 0.15;

const PUT_DOWN_SCALE = 1;
const PUT_DOWN_SHADOW = "none";
const PUT_DOWN_DURATION = 0.2;

const REPOSITION_DURATION = 0.3;

/**
 * Scales element up with enhanced shadow on drag start.
 *
 * @param element - The dragged tile element.
 * @returns A GSAP Tween for the pick-up animation.
 */
export function animatePickUp(element: HTMLElement): gsap.core.Tween {
  return gsap.to(element, {
    scale: PICK_UP_SCALE,
    boxShadow: PICK_UP_SHADOW,
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
    scale: PUT_DOWN_SCALE,
    boxShadow: PUT_DOWN_SHADOW,
    duration: PUT_DOWN_DURATION,
    ease: "power2.out",
    clearProps: "all",
  });
}

/**
 * Animates element to the given x/y transform offset, settling nearby
 * rather than snapping back to origin. Also resets scale to 1.
 *
 * @param element - The dragged tile element.
 * @param x - Target x transform offset.
 * @param y - Target y transform offset.
 * @returns A GSAP Tween for the reposition animation.
 */
export function animateReposition(element: HTMLElement, x: number, y: number): gsap.core.Tween {
  return gsap.to(element, {
    x,
    y,
    scale: 1,
    boxShadow: PUT_DOWN_SHADOW,
    duration: REPOSITION_DURATION,
    ease: "power2.out",
  });
}
