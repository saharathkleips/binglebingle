/**
 * @file motion-tokens.ts
 *
 * Shared timing, easing, and palette values for GSAP animation helpers.
 */

/** Near-immediate feedback for tiny reversible effects, such as rotate squeeze. */
export const MOTION_DURATION_INSTANT = 0.08;

/** Fast emphasis pulse used when a tile absorbs another tile during compose. */
export const MOTION_DURATION_FAST = 0.14;

/** Drag pick-up timing; intentionally close to CSS `--motion-duration-fast` hover lift. */
export const MOTION_DURATION_PICK_UP = 0.15;

/** Filled submission slot and history tile reveal timing. */
export const MOTION_DURATION_SLOT_ENTRANCE = 0.2;

/** Default entrance and row reveal timing for medium-weight UI motion. */
export const MOTION_DURATION_MEDIUM = 0.22;

/** Shared failed-drop and cross-owner snap-back travel timing. */
export const MOTION_DURATION_SNAP = 0.3;

/** Particle lifetime for compose/decompose celebration bursts. */
export const MOTION_DURATION_PARTICLE_BURST = 0.42;

/** Delay between history tiles during submitted-row reveal. */
export const MOTION_STAGGER_HISTORY_TILE = 0.12;

/** Starts history tile reveal just before the row slide finishes. */
export const MOTION_OVERLAP_HISTORY_TILE = "-=0.06";

/** Default deceleration for UI feedback that should settle smoothly. */
export const MOTION_EASE_STANDARD_OUT = "power2.out";

/** Default acceleration for squeeze-in phases. */
export const MOTION_EASE_STANDARD_IN = "power2.in";

/** Stronger deceleration for deliberate game-action emphasis. */
export const MOTION_EASE_DECISIVE_OUT = "power3.out";

/** Symmetric decisive easing for flip/reveal transforms. */
export const MOTION_EASE_DECISIVE_IN_OUT = "power3.inOut";

/** Spring-like easing for snap-back motion into a stable destination. */
export const MOTION_EASE_SNAP = "back.out(1.2)";

/** Larger overshoot for elements entering from a hidden or small state. */
export const MOTION_EASE_ENTRANCE = "back.out(1.7)";

/** 오방색/단청 palette used for particle bursts. */
export const PARTICLE_BURST_COLORS = [
  "#c3291b", // obangsaek-red
  "#f7ce46", // obangsaek-yellow
  "#0a0af5", // obangsaek-blue
  "#347641", // obangsaek-green
  "#e25749", // dancheong-red
  "#4da576", // dancheong-green
  "#393f69", // dancheong-blue
  "#fbe596", // dancheong-yellow
] as const;
