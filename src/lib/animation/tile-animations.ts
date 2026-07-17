/**
 * @file tile-animations.ts
 *
 * GSAP animation helpers for tile game actions: compose pulse,
 * entrance scale, history row reveal, and particle burst.
 * All helpers return either a Tween/Timeline or a cleanup function.
 */

import {
  MOTION_DURATION_FAST,
  MOTION_DURATION_INSTANT,
  MOTION_DURATION_MEDIUM,
  MOTION_DURATION_PARTICLE_BURST,
  MOTION_DURATION_SLOT_ENTRANCE,
  MOTION_EASE_DECISIVE_IN_OUT,
  MOTION_EASE_DECISIVE_OUT,
  MOTION_EASE_ENTRANCE,
  MOTION_EASE_STANDARD_IN,
  MOTION_EASE_STANDARD_OUT,
  MOTION_OVERLAP_HISTORY_TILE,
  MOTION_STAGGER_HISTORY_TILE,
  PARTICLE_BURST_COLORS,
} from "./motion-tokens";
import { gsap } from "./register";

const PARTICLE_COUNT = 8;

export type EntranceScaleOptions = {
  fromScale?: number;
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
 * Plays a scale "heartbeat" on the tile that absorbed a compose.
 * Call on the target tile element immediately after the compose dispatch.
 *
 * @param element - The tile element that received the incoming tile.
 * @param onComplete - Optional callback invoked when the animation finishes.
 * @returns A GSAP Tween — kill it if the component unmounts early.
 */
export function animateComposePulse(
  element: HTMLElement,
  onComplete?: () => void,
): gsap.core.Tween {
  return gsap.to(element, {
    scale: 1.22,
    duration: MOTION_DURATION_FAST,
    ease: MOTION_EASE_DECISIVE_OUT,
    yoyo: true,
    repeat: 1,
    ...(onComplete !== undefined && { onComplete }),
  });
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

  // Tiles flip in one-by-one, left to right.
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

  return timeline;
}

/**
 * Emits a brief particle burst from the center of `element`.
 * Particles are fixed-positioned divs appended to `document.body` and
 * removed when the animation completes.
 *
 * @param element - The element whose center is the burst origin.
 * @returns A cleanup function that kills the animation and removes particles immediately.
 */
export function animateParticleBurst(element: HTMLElement): () => void {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const particle = document.createElement("div");
    particle.style.cssText = [
      "position:fixed",
      `left:${centerX}px`,
      `top:${centerY}px`,
      "width:6px",
      "height:6px",
      "border-radius:50%",
      `background:${PARTICLE_BURST_COLORS[index % PARTICLE_BURST_COLORS.length]}`,
      "pointer-events:none",
      "z-index:9999",
      "transform:translate(-50%,-50%)",
    ].join(";");
    document.body.appendChild(particle);
    return particle;
  });

  // Shared cleanup referenced by both the returned handle and the timeline's
  // onComplete, so the two code paths converge on a single function body.
  // `let` hoisting lets us declare cleanup before timeline is constructed.
  let timeline: gsap.core.Timeline;
  function cleanup() {
    timeline?.kill();
    particles.forEach((particle) => particle.remove());
  }

  timeline = gsap.timeline({ onComplete: cleanup });

  particles.forEach((particle, index) => {
    const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
    // Fixed angles give a clean radial burst; no random — reproducible in tests.
    const distance = 30 + (index % 3) * 8;
    timeline.to(
      particle,
      {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: 0,
        scale: 0.3,
        duration: MOTION_DURATION_PARTICLE_BURST,
        ease: MOTION_EASE_STANDARD_OUT,
      },
      0,
    );
  });

  return cleanup;
}
