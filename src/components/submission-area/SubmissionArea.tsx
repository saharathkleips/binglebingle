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
export function SubmissionArea() {
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
      aria-label="Submission area"
      aria-busy={isSubmissionAnimating || undefined}
      {...{ [DATA_SUBMISSION_ANIMATING_ATTRIBUTE]: isSubmissionAnimating || undefined }}
    >
      <div ref={slotsRef} className={styles.slots} {...{ [DATA_SUBMISSION_SLOTS_ATTRIBUTE]: true }}>
        {state.submission.map((slot, index) => (
          <SubmissionSlot
            key={index}
            slot={slot}
            slotIndex={index}
            onTap={() => handleSlotRemove(index)}
            onDropOnSlot={(toSlotIndex) => handleSlotMove(index, toSlotIndex)}
            onDropOnPool={() => handleSlotRemove(index)}
          />
        ))}
      </div>
      <SubmissionButton isDisabled={isSubmitDisabled} onSubmit={handleSubmit} />
    </section>
  );
}
