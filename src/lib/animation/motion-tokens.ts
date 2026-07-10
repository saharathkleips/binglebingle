/**
 * @file motion-tokens.ts
 *
 * Shared timing, easing, and palette values for GSAP animation helpers.
 */

export const MOTION_DURATION_INSTANT = 0.08;
export const MOTION_DURATION_FAST = 0.14;
export const MOTION_DURATION_PICK_UP = 0.15;
export const MOTION_DURATION_SLOT_ENTRANCE = 0.2;
export const MOTION_DURATION_MEDIUM = 0.22;
export const MOTION_DURATION_SNAP = 0.3;
export const MOTION_DURATION_PARTICLE_BURST = 0.42;
export const MOTION_STAGGER_HISTORY_TILE = 0.12;
export const MOTION_OVERLAP_HISTORY_TILE = "-=0.06";

export const MOTION_EASE_STANDARD_OUT = "power2.out";
export const MOTION_EASE_STANDARD_IN = "power2.in";
export const MOTION_EASE_DECISIVE_OUT = "power3.out";
export const MOTION_EASE_DECISIVE_IN_OUT = "power3.inOut";
export const MOTION_EASE_SNAP = "back.out(1.2)";
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
