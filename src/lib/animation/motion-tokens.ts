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

/** Default timing for medium-weight UI motion such as history-row shifts. */
export const MOTION_DURATION_MEDIUM = 0.22;

/** Shared failed-drop snap-back travel timing. */
export const MOTION_DURATION_SNAP = 0.3;

/** Accepted drop travel timing from a released tile into its rendered destination. */
export const MOTION_DURATION_ACCEPTED_DROP = 0.26;

/** Tunable timings for the submitted-slots-to-history reveal sequence. */
export const SUBMISSION_HISTORY_REVEAL_TIMING = {
  /** Existing history rows shift upward to make visual room for the incoming row. */
  historyRowsShiftDuration: MOTION_DURATION_MEDIUM,
  /** Submitted slot silhouettes travel from the submission row and land as history cards. */
  cardDealDuration: 0.26,
  /** Delay between each submitted slot silhouette starting its deal into history. */
  cardDealStagger: 0.16,
  /** Hold between the last dealt card landing and the first result reveal. */
  cardRevealStartDelay: 0,
  /** Delay between each landed card starting its present/absent/correct reveal. */
  cardRevealStagger: 0.16,
  /** Duration of each half of the present/absent/correct result flip. */
  cardFlipHalfDuration: 0.13,
  /** Duration of one half of the final yoyo pulse after a card is revealed. */
  cardPulseDuration: 0.1,
  /** Small hold after the final card reveal before React commits the submitted row. */
  completionHoldDuration: MOTION_DURATION_FAST,
} as const;

/** Tunable timings for submitted pieces decomposing back into the pool after submit. */
export const RETURN_TO_POOL_AFTER_SUBMISSION_TIMING = {
  /** Delay before the first returned tile starts moving to the pool. */
  startDelay: 0.18,
  /** Delay between each returned tile's snap-back start. */
  stagger: 0.12,
} as const;

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

/** Shared tween options for failed-drop motion. */
export const SNAP_BACK_ANIMATION = {
  duration: MOTION_DURATION_SNAP,
  ease: MOTION_EASE_SNAP,
} as const;

/** Smooth, non-overshooting travel for accepted drops into stable destinations. */
export const ACCEPTED_DROP_ANIMATION = {
  duration: MOTION_DURATION_ACCEPTED_DROP,
  ease: MOTION_EASE_DECISIVE_OUT,
} as const;
