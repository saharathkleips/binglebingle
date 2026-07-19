/**
 * @file tile-animations.ts
 *
 * GSAP animation helpers for tile game actions: compose impact,
 * entrance scale, and history row reveal.
 * All helpers return a Tween or Timeline.
 */

import {
  MOTION_DURATION_FAST,
  MOTION_DURATION_INSTANT,
  MOTION_DURATION_MEDIUM,
  MOTION_DURATION_SLOT_ENTRANCE,
  MOTION_EASE_DECISIVE_IN_OUT,
  MOTION_EASE_ENTRANCE,
  MOTION_EASE_STANDARD_IN,
  MOTION_EASE_STANDARD_OUT,
  MOTION_OVERLAP_HISTORY_TILE,
  MOTION_STAGGER_HISTORY_TILE,
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
      scale: 0.8,
      duration: MOTION_DURATION_FAST,
      ease: MOTION_EASE_STANDARD_IN,
    })
    .to(element, {
      scale: 1.18,
      duration: MOTION_DURATION_FAST,
      ease: "back.out(1.8)",
    })
    .to(element, {
      scale: 1,
      duration: MOTION_DURATION_INSTANT,
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

/**
 * Stagger-reveals a history row after a guess is submitted.
 * The row slides in from below, then each tile flips in left-to-right.
 *
 * @param rowElement - The `.row` container holding the HistoryTile divs.
 * @returns A GSAP Timeline — kill it on unmount.
 */
export function animateHistoryRowReveal(rowElement: HTMLElement): gsap.core.Timeline {
  const timeline = gsap.timeline();
  const tiles = rowElement.querySelectorAll("[data-history-tile]");

  // Row slides up from just below its final position.
  timeline.from(rowElement, {
    y: 20,
    opacity: 0,
    duration: MOTION_DURATION_MEDIUM,
    ease: MOTION_EASE_STANDARD_OUT,
  });

  // Tiles flip in one-by-one, left to right. Skip the tween when no tiles exist;
  // GSAP logs a target warning for empty NodeLists, and an empty row has nothing to reveal.
  if (tiles.length > 0) {
    timeline.from(
      tiles,
      {
        scaleX: 0,
        duration: MOTION_DURATION_SLOT_ENTRANCE,
        ease: MOTION_EASE_DECISIVE_IN_OUT,
        stagger: MOTION_STAGGER_HISTORY_TILE,
      },
      MOTION_OVERLAP_HISTORY_TILE,
    );
  }

  return timeline;
}
