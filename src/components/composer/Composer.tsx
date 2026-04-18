/**
 * @file Composer.tsx
 *
 * Submission area: a row of SubmissionSlots plus a SubmitButton.
 * Player assembles syllable characters in slots and submits guesses.
 */

import { useGame } from "../../context/game/GameContext";
import { SubmissionSlot } from "./SubmissionSlot";
import { SubmitButton } from "./SubmitButton";
import styles from "./Composer.module.css";

export function Composer() {
  const { state, dispatch } = useGame();

  return (
    <div className={styles.composer} data-testid="composer">
      <div className={styles.slots}>
        {state.submission.map((slot, index) => (
          <SubmissionSlot key={index} slot={slot} slotIndex={index} dispatch={dispatch} />
        ))}
      </div>
      <SubmitButton submission={state.submission} dispatch={dispatch} />
    </div>
  );
}
