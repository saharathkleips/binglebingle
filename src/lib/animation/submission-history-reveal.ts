/**
 * @file submission-history-reveal.ts
 *
 * GSAP animation helper for revealing submitted slots into guess history.
 */

import {
  MOTION_DURATION_INSTANT,
  MOTION_EASE_STANDARD_OUT,
  SUBMISSION_HISTORY_REVEAL_TIMING,
} from "./motion-tokens";
import {
  DATA_HISTORY_ROW_INDEX_ATTRIBUTE,
  DATA_SLOT_HITBOX_ATTRIBUTE,
  DATA_SLOT_INDEX_ATTRIBUTE,
  DATA_SUBMISSION_HISTORY_REVEAL_CARD_ATTRIBUTE,
  DATA_SUBMISSION_SLOT_PLACEHOLDER_ATTRIBUTE,
  dataAttributeSelector,
} from "../dom-data-attributes";
import type { EvaluatedCharacter } from "../engine";
import { scheduleNextFrame } from "./frame-scheduler";
import { createCardFlipRevealTimeline, createCardPulseTimeline } from "./submission-history-card";
import { reserveHistoryRowScrollSpace } from "./submission-history-scroll-space";
import { gsap } from "./register";

/** Options for the submitted-slot reveal animation. */
export type SubmissionSlotsRevealOptions = {
  /** Called before temporary history scroll-space is restored. */
  onBeforeRestore?: () => void;
  /** Called after temporary history scroll-space is restored. */
  onComplete?: () => void;
};

const SUBMISSION_HISTORY_REVEAL_CARD_CLASS = "submission-history-reveal-card";

type RevealSlotEntry = {
  placeholder: HTMLElement;
  evaluated: EvaluatedCharacter;
};

type RevealCardEntry = {
  clone: HTMLElement;
  evaluated: EvaluatedCharacter;
};

/**
 * Animates cloned submission-slot backs upward, then flips them left-to-right to
 * reveal evaluated history cards. The game state should be committed in
 * `onComplete` so active submitted tiles remain in place throughout the reveal.
 *
 * @param slotsContainer - The `[data-submission-slots]` element.
 * @param evaluation - Evaluated submitted characters, in slot order.
 * @param historyContainer - Optional guess-history container whose existing rows should move up first.
 * @param options - Optional lifecycle callbacks.
 * @returns A GSAP Timeline — kill it if the component unmounts early.
 */
export function animateSubmissionSlotsToHistoryReveal(
  slotsContainer: HTMLElement,
  evaluation: readonly EvaluatedCharacter[],
  historyContainer: HTMLElement | null = null,
  options: SubmissionSlotsRevealOptions = {},
): gsap.core.Timeline {
  const historyRows = getHistoryRows(historyContainer);
  const slotEntries = collectRevealSlotEntries(slotsContainer, evaluation);

  if (slotEntries.length === 0) {
    return createFallbackSubmissionRevealTimeline(options);
  }

  const firstPlaceholderRect = slotEntries[0]!.placeholder.getBoundingClientRect();
  const historyRowTopsBeforeScroll = captureHistoryRowTops(historyRows);
  const historySpace = reserveHistoryRowScrollSpace(
    historyContainer,
    firstPlaceholderRect.width,
    firstPlaceholderRect.height,
    historyRows.length,
    firstPlaceholderRect.top - firstPlaceholderRect.height,
  );
  const cardEntries = createRevealCardClones(slotsContainer, slotEntries);
  const timeline = createRevealTimeline(cardEntries, historySpace.restore, options);
  const cardTravelY = getRevealCardTravelY(slotsContainer, cardEntries, historySpace.targetTop);

  addHistoryRowsShift(timeline, historyRows, historyRowTopsBeforeScroll);
  addCardDeal(timeline, cardEntries, cardTravelY);
  addCardReveals(timeline, cardEntries);
  timeline.to({}, { duration: SUBMISSION_HISTORY_REVEAL_TIMING.completionHoldDuration });

  return timeline;
}

function getHistoryRows(historyContainer: HTMLElement | null): HTMLElement[] {
  return Array.from(
    historyContainer?.querySelectorAll<HTMLElement>(
      dataAttributeSelector(DATA_HISTORY_ROW_INDEX_ATTRIBUTE),
    ) ?? [],
  );
}

function collectRevealSlotEntries(
  slotsContainer: HTMLElement,
  evaluation: readonly EvaluatedCharacter[],
): RevealSlotEntry[] {
  return evaluation.flatMap((evaluated, slotIndex) => {
    const slotElement = slotsContainer.querySelector<HTMLElement>(
      `${dataAttributeSelector(DATA_SLOT_INDEX_ATTRIBUTE, slotIndex)}${dataAttributeSelector(
        DATA_SLOT_HITBOX_ATTRIBUTE,
      )}`,
    );
    const placeholder = slotElement?.querySelector<HTMLElement>(
      dataAttributeSelector(DATA_SUBMISSION_SLOT_PLACEHOLDER_ATTRIBUTE),
    );
    if (placeholder === undefined || placeholder === null) return [];

    return [{ placeholder, evaluated }];
  });
}

function captureHistoryRowTops(historyRows: readonly HTMLElement[]): Map<HTMLElement, number> {
  return new Map(historyRows.map((row) => [row, row.getBoundingClientRect().top]));
}

function createRevealCardClones(
  slotsContainer: HTMLElement,
  slotEntries: readonly RevealSlotEntry[],
): RevealCardEntry[] {
  return slotEntries.map(({ placeholder, evaluated }) => {
    const clone = placeholder.cloneNode(true) as HTMLElement;
    const rect = placeholder.getBoundingClientRect();
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute(DATA_SUBMISSION_HISTORY_REVEAL_CARD_ATTRIBUTE, "true");
    clone.classList.add(SUBMISSION_HISTORY_REVEAL_CARD_CLASS);
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    slotsContainer.appendChild(clone);

    return { clone, evaluated };
  });
}

function createRevealTimeline(
  cardEntries: readonly RevealCardEntry[],
  restoreHistorySpace: () => void,
  options: SubmissionSlotsRevealOptions,
): gsap.core.Timeline {
  return gsap.timeline({
    onComplete: () => completeSubmissionReveal(cardEntries, restoreHistorySpace, options),
    onInterrupt: () => interruptSubmissionReveal(cardEntries, restoreHistorySpace),
  });
}

function getRevealCardTravelY(
  slotsContainer: HTMLElement,
  cardEntries: readonly RevealCardEntry[],
  historyTargetTop: number,
): number {
  const firstCardRect = cardEntries[0]!.clone.getBoundingClientRect();
  const rowAboveSubmissionTop =
    slotsContainer.getBoundingClientRect().top -
    getSlotColumnGap(slotsContainer) -
    firstCardRect.height;
  const targetTop = Math.min(historyTargetTop, rowAboveSubmissionTop);

  return targetTop - firstCardRect.top;
}

function getSlotColumnGap(slotsContainer: HTMLElement): number {
  const computedStyle = getComputedStyle(slotsContainer);

  return Number.parseFloat(computedStyle.columnGap || computedStyle.gap) || 0;
}

function addHistoryRowsShift(
  timeline: gsap.core.Timeline,
  historyRows: readonly HTMLElement[],
  historyRowTopsBeforeScroll: ReadonlyMap<HTMLElement, number>,
): void {
  const shiftedHistoryRows = historyRows.filter((row) => historyRowTopsBeforeScroll.has(row));
  shiftedHistoryRows.forEach((row) => {
    const previousTop = historyRowTopsBeforeScroll.get(row);
    if (previousTop === undefined) return;

    gsap.set(row, { y: previousTop - row.getBoundingClientRect().top });
  });

  if (shiftedHistoryRows.length === 0) return;

  timeline.to(shiftedHistoryRows, {
    y: 0,
    duration: SUBMISSION_HISTORY_REVEAL_TIMING.historyRowsShiftDuration,
    ease: MOTION_EASE_STANDARD_OUT,
  });
}

function addCardDeal(
  timeline: gsap.core.Timeline,
  cardEntries: readonly RevealCardEntry[],
  cardTravelY: number,
): void {
  timeline.to(
    cardEntries.map(({ clone }) => clone),
    {
      y: cardTravelY,
      duration: SUBMISSION_HISTORY_REVEAL_TIMING.cardDealDuration,
      ease: MOTION_EASE_STANDARD_OUT,
      stagger: SUBMISSION_HISTORY_REVEAL_TIMING.cardDealStagger,
    },
  );
}

function addCardReveals(
  timeline: gsap.core.Timeline,
  cardEntries: readonly RevealCardEntry[],
): void {
  timeline.addLabel("cardReveal", `>+=${SUBMISSION_HISTORY_REVEAL_TIMING.cardRevealStartDelay}`);

  cardEntries.forEach(({ clone, evaluated }, cardIndex) => {
    const position = `cardReveal+=${cardIndex * SUBMISSION_HISTORY_REVEAL_TIMING.cardRevealStagger}`;

    timeline.add(
      evaluated.character === undefined
        ? createCardPulseTimeline(clone)
        : createCardFlipRevealTimeline(clone, evaluated),
      position,
    );
  });
}

function removeRevealCardClones(cardEntries: readonly RevealCardEntry[]): void {
  cardEntries.forEach(({ clone }) => clone.remove());
}

function createFallbackSubmissionRevealTimeline(
  options: SubmissionSlotsRevealOptions,
): gsap.core.Timeline {
  return gsap
    .timeline({
      onComplete: () => completeSubmissionReveal([], () => {}, options),
    })
    .to({}, { duration: MOTION_DURATION_INSTANT });
}

function completeSubmissionReveal(
  cardEntries: readonly RevealCardEntry[],
  restoreHistorySpace: () => void,
  options: SubmissionSlotsRevealOptions,
): void {
  let beforeRestoreError: unknown;

  try {
    options.onBeforeRestore?.();
  } catch (error) {
    beforeRestoreError = error;
  } finally {
    restoreHistorySpace();
    scheduleNextFrame(() => {
      removeRevealCardClones(cardEntries);
    });
  }

  options.onComplete?.();
  if (beforeRestoreError !== undefined) throw beforeRestoreError;
}

function interruptSubmissionReveal(
  cardEntries: readonly RevealCardEntry[],
  restoreHistorySpace: () => void,
): void {
  restoreHistorySpace();
  removeRevealCardClones(cardEntries);
}
