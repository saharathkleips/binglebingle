/**
 * @file SubmissionArea.tsx
 *
 * Submission area: a row of SubmissionSlots plus a SubmissionButton.
 * Player assembles syllable characters in slots and submits guesses.
 */

import { useGame } from "../../context/game/GameContext";
import { SubmissionSlot } from "./SubmissionSlot";
import { SubmissionButton } from "./SubmissionButton";
import styles from "./SubmissionArea.module.css";

/**
 * Renders the submission row and submit button from game state.
 * Player places tiles into slots, sees resolved characters, and submits guesses.
 */
export function SubmissionArea() {
  const { state, dispatch } = useGame();

  return (
    <div className={styles.submissionArea} data-testid="submission-area">
      <div className={styles.slots}>
        {state.submission.map((slot, index) => (
          <SubmissionSlot
            key={index}
            slot={slot}
            slotIndex={index}
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
      <SubmissionButton submission={state.submission} dispatch={dispatch} />
    </div>
  );
}
