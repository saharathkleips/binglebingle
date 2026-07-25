/**
 * @file submission-history-card.ts
 *
 * Card-level timelines for submitted-slot history reveal animation.
 */

import {
  MOTION_EASE_DECISIVE_IN_OUT,
  MOTION_EASE_STANDARD_OUT,
  SUBMISSION_HISTORY_REVEAL_TIMING,
} from "./motion-tokens";
import { resolveCharacter } from "../character";
import { DATA_RESULT_ATTRIBUTE } from "../dom-data-attributes";
import type { EvaluatedCharacter } from "../engine";
import { gsap } from "./register";

/** Builds the flip + pulse reveal for a submitted history card clone. */
export function createCardFlipRevealTimeline(
  clone: HTMLElement,
  evaluated: EvaluatedCharacter,
): gsap.core.Timeline {
  return gsap
    .timeline()
    .to(clone, {
      scaleX: 0,
      duration: SUBMISSION_HISTORY_REVEAL_TIMING.cardFlipHalfDuration,
      ease: MOTION_EASE_DECISIVE_IN_OUT,
    })
    .call(() => revealSubmissionHistoryCard(clone, evaluated))
    .to(clone, {
      scaleX: 1,
      duration: SUBMISSION_HISTORY_REVEAL_TIMING.cardFlipHalfDuration,
      ease: MOTION_EASE_DECISIVE_IN_OUT,
    })
    .add(createCardPulseTimeline(clone));
}

/** Builds the final pulse for a submitted history card clone. */
export function createCardPulseTimeline(clone: HTMLElement): gsap.core.Timeline {
  return gsap.timeline().to(clone, {
    scaleX: 1.05,
    scaleY: 1.08,
    duration: SUBMISSION_HISTORY_REVEAL_TIMING.cardPulseDuration,
    ease: MOTION_EASE_STANDARD_OUT,
    repeat: 1,
    yoyo: true,
  });
}

function revealSubmissionHistoryCard(clone: HTMLElement, evaluated: EvaluatedCharacter): void {
  clone.replaceChildren();
  clone.setAttribute(DATA_RESULT_ATTRIBUTE, evaluated.result);
  clone.textContent =
    evaluated.character === undefined ? "" : (resolveCharacter(evaluated.character) ?? "");
}
