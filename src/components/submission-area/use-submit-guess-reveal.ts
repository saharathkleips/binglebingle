/**
 * @file use-submit-guess-reveal.ts
 *
 * Coordinates the submit reveal animation with the pure game-state commit.
 */

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { flushSync } from "react-dom";
import { useGame } from "../../context/game/GameContext";
import { prepareSubmitGuessTransition } from "../../context/game/round-actions";
import { recordSubmissionReturnSnapBacks } from "../../lib/animation/submission-return-snap-backs";
import { animateSubmissionSlotsToHistoryReveal } from "../../lib/animation/submission-history-reveal";
import { canSubmit } from "../../lib/engine/validate";

/** Submit reveal controls consumed by {@link SubmissionArea}. */
export type SubmitGuessRevealControls = {
  /** Ref for the submission slots container used as the animation source. */
  slotsRef: RefObject<HTMLDivElement | null>;
  /** Whether the submitted slots are currently revealing into history. */
  isSubmissionAnimating: boolean;
  /** Whether the submit button should be disabled. */
  isSubmitDisabled: boolean;
  /** Starts the animated submit flow when the current submission is valid. */
  handleSubmit: () => void;
  /** Removes a filled slot unless input is locked. */
  handleSlotRemove: (slotIndex: number) => void;
  /** Moves a filled slot unless input is locked. */
  handleSlotMove: (fromSlotIndex: number, toSlotIndex: number) => void;
};

/**
 * Encapsulates submit-owned animation orchestration so `SubmissionArea` can stay
 * focused on rendering slots and wiring interaction handlers.
 */
export function useSubmitGuessReveal(): SubmitGuessRevealControls {
  const { state, dispatch, isInputLocked, acquireInputLock, historyAreaRef } = useGame();
  const slotsRef = useRef<HTMLDivElement>(null);
  const activeSubmitTimelineRef = useRef<ReturnType<
    typeof animateSubmissionSlotsToHistoryReveal
  > | null>(null);
  const releaseInputLockRef = useRef<(() => void) | null>(null);
  const [isSubmissionAnimating, setIsSubmissionAnimating] = useState(false);
  const isSubmitDisabled =
    isInputLocked || isSubmissionAnimating || canSubmit(state.submission) !== "VALID";

  useLayoutEffect(() => {
    return () => {
      activeSubmitTimelineRef.current?.kill();
      releaseSubmitInputLock();
    };
  }, []);

  function handleSubmit() {
    if (isSubmitDisabled || slotsRef.current === null || activeSubmitTimelineRef.current !== null) {
      return;
    }

    const transition = prepareSubmitGuessTransition(state);
    const slotsContainer = slotsRef.current;
    releaseInputLockRef.current = acquireInputLock();
    setIsSubmissionAnimating(true);

    try {
      activeSubmitTimelineRef.current = animateSubmissionSlotsToHistoryReveal(
        slotsContainer,
        transition.evaluation,
        historyAreaRef.current,
        {
          onBeforeRestore: () => {
            recordSubmissionReturnSnapBacks(transition.returnedTilesBySlot, slotsContainer);
          },
          onComplete: () => {
            activeSubmitTimelineRef.current = null;
            try {
              flushSync(() => {
                dispatch({ type: "ROUND_SUBMISSION_COMMIT", payload: transition });
                setIsSubmissionAnimating(false);
              });
            } finally {
              releaseSubmitInputLock();
            }
          },
        },
      );
    } catch (error) {
      activeSubmitTimelineRef.current = null;
      setIsSubmissionAnimating(false);
      releaseSubmitInputLock();
      throw error;
    }
  }

  function handleSlotRemove(slotIndex: number) {
    if (isInputLocked || isSubmissionAnimating) return;

    dispatch({ type: "SUBMISSION_SLOT_REMOVE", payload: { slotIndex } });
  }

  function handleSlotMove(fromSlotIndex: number, toSlotIndex: number) {
    if (isInputLocked || isSubmissionAnimating) return;

    dispatch({
      type: "SUBMISSION_SLOT_MOVE",
      payload: { fromSlotIndex, toSlotIndex },
    });
  }

  function releaseSubmitInputLock() {
    releaseInputLockRef.current?.();
    releaseInputLockRef.current = null;
  }

  return {
    slotsRef,
    isSubmissionAnimating,
    isSubmitDisabled,
    handleSubmit,
    handleSlotRemove,
    handleSlotMove,
  };
}
