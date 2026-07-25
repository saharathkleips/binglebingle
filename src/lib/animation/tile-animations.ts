/**
 * @file tile-animations.ts
 *
 * GSAP animation helpers for tile game actions: compose impact and entrance scale.
 * All helpers return a Tween or Timeline.
 */

import {
  MOTION_DURATION_INSTANT,
  MOTION_DURATION_MEDIUM,
  MOTION_EASE_ENTRANCE,
  MOTION_EASE_STANDARD_IN,
  MOTION_EASE_STANDARD_OUT,
} from "./motion-tokens";
import { gsap } from "./register";

/** Options for tile entrance scale animations. */
export type EntranceScaleOptions = {
  /** Initial scale before the tile grows into its natural size. */
  fromScale?: number;
  /** Animation duration in seconds. */
  duration?: number;
};

/**
 * Plays a brief squeeze pulse when a tile's jamo rotates.
 *
 * @param element - The tile element whose character changed.
 * @param onComplete - Optional callback invoked when the animation finishes.
 * @returns A GSAP Tween — kill it if the component unmounts early.
 */
export function animateRotateSqueeze(
  element: HTMLElement,
  onComplete?: () => void,
): gsap.core.Tween {
  return gsap.to(element, {
    scale: 0.82,
    duration: MOTION_DURATION_INSTANT,
    ease: MOTION_EASE_STANDARD_IN,
    yoyo: true,
    repeat: 1,
    ...(onComplete !== undefined && { onComplete }),
  });
}

/**
 * Plays an impact rebound on the tile that absorbed a compose.
 * The target compresses on contact, springs larger, then settles back to natural size.
 * Call on the target tile element immediately after the compose dispatch.
 *
 * @param element - The tile element that received the incoming tile.
 * @param onComplete - Optional callback invoked when the animation finishes.
 * @returns A GSAP Timeline — kill it if the component unmounts early.
 */
export function animateComposePulse(
  element: HTMLElement,
  onComplete?: () => void,
): gsap.core.Timeline {
  const timeline = gsap.timeline({ ...(onComplete !== undefined && { onComplete }) });

  timeline
    .to(element, {
      scale: 0.84,
      duration: 0.09,
      ease: MOTION_EASE_STANDARD_IN,
    })
    .to(element, {
      scale: 1.14,
      duration: 0.1,
      ease: "back.out(2)",
    })
    .to(element, {
      scale: 1,
      duration: 0.06,
      ease: MOTION_EASE_STANDARD_OUT,
      clearProps: "scale",
    });

  return timeline;
}

/**
 * Entrance animation for a newly-appeared tile.
 * Animates FROM a configured scale TO the element's natural scale with a back-ease overshoot.
 * Used for decompose results, filled submission slots, and other tile appearances.
 *
 * @param element - The element to animate in.
 * @param onComplete - Optional callback invoked when the animation finishes.
 * @param options - Optional entrance scale and timing overrides.
 * @returns A GSAP Tween — kill it if the component unmounts early.
 */
export function animateEntranceScale(
  element: HTMLElement,
  onComplete?: () => void,
  options: EntranceScaleOptions = {},
): gsap.core.Tween {
  return gsap.from(element, {
    scale: options.fromScale ?? 0,
    duration: options.duration ?? MOTION_DURATION_MEDIUM,
    ease: MOTION_EASE_ENTRANCE,
    clearProps: "scale",
    ...(onComplete !== undefined && { onComplete }),
  });
}
