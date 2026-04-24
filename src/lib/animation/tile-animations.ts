/**
 * @file tile-animations.ts
 *
 * GSAP animation helpers for tile game actions: compose pulse,
 * entrance scale, history row reveal, and particle burst.
 * All helpers return either a Tween/Timeline or a cleanup function.
 */

import { gsap } from "./register";

/** 오방색/단청 palette used for particle bursts. */
const PARTICLE_COLORS = [
  "#c3291b", // obangsaek-red
  "#f7ce46", // obangsaek-yellow
  "#0a0af5", // obangsaek-blue
  "#347641", // obangsaek-green
  "#e25749", // dancheong-red
  "#4da576", // dancheong-green
  "#393f69", // dancheong-blue
  "#fbe596", // dancheong-yellow
];

const PARTICLE_COUNT = 8;

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
    duration: 0.13,
    ease: "power3.out",
    yoyo: true,
    repeat: 1,
    ...(onComplete !== undefined && { onComplete }),
  });
}

/**
 * Entrance animation for a newly-appeared tile.
 * Animates FROM scale 0 TO the element's natural scale with a back-ease overshoot.
 * Used for decompose results and other tile appearances.
 *
 * @param element - The element to animate in.
 * @param onComplete - Optional callback invoked when the animation finishes.
 * @returns A GSAP Tween — kill it if the component unmounts early.
 */
export function animateEntranceScale(
  element: HTMLElement,
  onComplete?: () => void,
): gsap.core.Tween {
  return gsap.from(element, {
    scale: 0,
    duration: 0.22,
    ease: "back.out(1.7)",
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
  const tiles = rowElement.querySelectorAll('[data-testid="history-tile"]');

  // Row slides up from just below its final position.
  timeline.from(rowElement, {
    y: 20,
    opacity: 0,
    duration: 0.22,
    ease: "power2.out",
  });

  // Tiles flip in one-by-one, left to right.
  timeline.from(
    tiles,
    {
      scaleX: 0,
      duration: 0.2,
      ease: "power3.inOut",
      stagger: 0.12,
    },
    "-=0.06",
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
      `background:${PARTICLE_COLORS[index % PARTICLE_COLORS.length]}`,
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
        duration: 0.42,
        ease: "power2.out",
      },
      0,
    );
  });

  return cleanup;
}
