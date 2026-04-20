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

export function SubmissionArea() {
  const { state, dispatch } = useGame();

  return (
    <div className={styles.submissionArea} data-testid="submission-area">
      <div className={styles.slots}>
        {state.submission.map((slot, index) => (
          <SubmissionSlot key={index} slot={slot} slotIndex={index} dispatch={dispatch} />
        ))}
      </div>
      <SubmissionButton submission={state.submission} dispatch={dispatch} />
    </div>
  );
}
