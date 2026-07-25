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
import {
  DATA_HISTORY_EMPTY_CARD_ATTRIBUTE,
  DATA_RESULT_ATTRIBUTE,
} from "../dom-data-attributes";
import { getEvaluatedCharacterText } from "../evaluated-character-display";
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
    // The cloned lotus back is edge-on at this point, so the content swap is hidden.
    .call(() => revealSubmissionHistoryCardClone(clone, evaluated))
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

/** Builds the pulse for an empty submitted history card clone. */
export function createEmptyCardPulseTimeline(clone: HTMLElement): gsap.core.Timeline {
  return gsap
    .timeline()
    .call(() => {
      revealEmptyHistoryCardClone(clone);
      clone.style.setProperty("--lotus-motif-opacity", "1");
      clone.style.setProperty("--lotus-motif-saturation", "1");
    })
    .add(createCardPulseTimeline(clone))
    .call(() => {
      clone.style.removeProperty("--lotus-motif-opacity");
      clone.style.removeProperty("--lotus-motif-saturation");
    });
}

function revealSubmissionHistoryCardClone(
  clone: HTMLElement,
  evaluated: EvaluatedCharacter,
): void {
  const text = getEvaluatedCharacterText(evaluated);

  if (text === "") {
    revealEmptyHistoryCardClone(clone);
    return;
  }

  revealFilledHistoryCardClone(clone, evaluated.result, text);
}

function revealEmptyHistoryCardClone(clone: HTMLElement): void {
  clone.removeAttribute(DATA_RESULT_ATTRIBUTE);
  clone.setAttribute(DATA_HISTORY_EMPTY_CARD_ATTRIBUTE, "true");
}

function revealFilledHistoryCardClone(
  clone: HTMLElement,
  result: EvaluatedCharacter["result"],
  text: string,
): void {
  clone.replaceChildren();
  clone.removeAttribute(DATA_HISTORY_EMPTY_CARD_ATTRIBUTE);
  clone.setAttribute(DATA_RESULT_ATTRIBUTE, result);
  clone.textContent = text;
}

