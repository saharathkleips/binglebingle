/**
 * @file SubmissionArea.tsx
 *
 * Submission area: a row of SubmissionSlots plus a SubmissionButton.
 * Player assembles syllable characters in slots and submits guesses.
 */

import { useGame } from "../../context/game/GameContext";
import {
  DATA_SUBMISSION_ANIMATING_ATTRIBUTE,
  DATA_SUBMISSION_SLOTS_ATTRIBUTE,
} from "../../lib/dom-data-attributes";
import { SubmissionSlot } from "./SubmissionSlot";
import { SubmissionButton } from "./SubmissionButton";
import styles from "./SubmissionArea.module.css";
import { useSubmitGuessReveal } from "./use-submit-guess-reveal";

/**
 * Renders the submission row and submit button from game state.
 * Player places tiles into slots, sees resolved characters, and submits guesses.
 */
export type SubmissionAreaProps = {
  /** Disables moving, tapping, dropping, and submitting; useful for win-state placeholders. */
  isInteractionDisabled?: boolean;
  /** Whether to render the submit button below the slots. */
  isSubmitVisible?: boolean;
  /** Adds the repeating win dance animation to filled slots. */
  isWinDanceEnabled?: boolean;
};

export function SubmissionArea({
  isInteractionDisabled = false,
  isSubmitVisible = true,
  isWinDanceEnabled = false,
}: SubmissionAreaProps = {}) {
  const { state } = useGame();
  const {
    slotsRef,
    isSubmissionAnimating,
    isSubmitDisabled,
    handleSubmit,
    handleSlotRemove,
    handleSlotMove,
  } = useSubmitGuessReveal();

  return (
    <section
      className={styles.submissionArea}
      aria-label="제출 영역"
      aria-busy={isSubmissionAnimating || undefined}
      {...{ [DATA_SUBMISSION_ANIMATING_ATTRIBUTE]: isSubmissionAnimating || undefined }}
    >
      <div ref={slotsRef} className={styles.slots} {...{ [DATA_SUBMISSION_SLOTS_ATTRIBUTE]: true }}>
        {state.submission.map((slot, index) => (
          <SubmissionSlot
            key={index}
            slot={slot}
            slotIndex={index}
            isInteractionDisabled={isInteractionDisabled}
            isWinDanceEnabled={isWinDanceEnabled}
            onTap={() => {
              if (!isInteractionDisabled) handleSlotRemove(index);
            }}
            onDropOnSlot={(toSlotIndex) => {
              if (!isInteractionDisabled) handleSlotMove(index, toSlotIndex);
            }}
            onDropOnPool={() => {
              if (!isInteractionDisabled) handleSlotRemove(index);
            }}
          />
        ))}
      </div>
      {isSubmitVisible ? (
        <SubmissionButton
          isDisabled={isInteractionDisabled || isSubmitDisabled}
          onSubmit={handleSubmit}
        />
      ) : null}
    </section>
  );
}
