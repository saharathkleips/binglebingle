/**
 * @file SubmissionArea.tsx
 *
 * Submission area: a row of SubmissionSlots plus a SubmissionButton.
 * Player assembles syllable characters in slots and submits guesses.
 */

import { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/game/GameContext";
import { canSubmit } from "../../lib/engine/validate";
import { SubmissionSlot } from "./SubmissionSlot";
import { SubmissionButton } from "./SubmissionButton";
import styles from "./SubmissionArea.module.css";

/**
 * Renders the submission row and submit button from game state.
 * Player places tiles into slots, sees resolved characters, and submits guesses.
 */
export function SubmissionArea() {
  const { state, dispatch } = useGame();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevHistoryLengthRef = useRef(state.history.length);

  // Clear the submitting flag once the history grows (guess was evaluated).
  useEffect(() => {
    if (state.history.length > prevHistoryLengthRef.current) {
      setIsSubmitting(false);
    }
    prevHistoryLengthRef.current = state.history.length;
  }, [state.history.length]);

  const isReady = canSubmit(state.submission) === "VALID";

  return (
    <div className={styles.submissionArea} data-testid="submission-area">
      <div className={styles.slots}>
        {state.submission.map((slot, index) => (
          <SubmissionSlot
            key={index}
            slot={slot}
            slotIndex={index}
            isSubmitting={isSubmitting}
            isReady={isReady}
            onTap={() =>
              dispatch({ type: "SUBMISSION_SLOT_REMOVE", payload: { slotIndex: index } })
            }
            onDropOnSlot={(toSlotIndex) =>
              dispatch({
                type: "SUBMISSION_SLOT_MOVE",
                payload: { fromSlotIndex: index, toSlotIndex },
              })
            }
          />
        ))}
      </div>
      <SubmissionButton
        submission={state.submission}
        dispatch={dispatch}
        onSubmitStart={() => setIsSubmitting(true)}
      />
    </div>
  );
}
