/**
 * @file SubmissionButton.tsx
 *
 * Validates the current submission and dispatches ROUND_SUBMISSION_SUBMIT.
 */

import { type Dispatch } from "react";
import { Button, ButtonText } from "../button/Button";
import { canSubmit } from "../../lib/engine/validate";
import type { SubmissionSlot, GameAction } from "../../context/game";
import Hills2 from "./hills-2.svg?react";
import Hills3 from "./hills-3.svg?react";
import styles from "./SubmissionButton.module.css";

/**
 * @property submission - The current submission slots to validate.
 * @property dispatch - Game dispatch function.
 */
export type SubmissionButtonProps = {
  submission: readonly SubmissionSlot[];
  dispatch: Dispatch<GameAction>;
};

/**
 * Validates the current submission and dispatches ROUND_SUBMISSION_SUBMIT on click.
 *
 * @param props - {@link SubmissionButtonProps}
 */
export function SubmissionButton({ submission, dispatch }: SubmissionButtonProps) {
  const isValid = canSubmit(submission) === "VALID";

  function handleClick() {
    if (isValid) dispatch({ type: "ROUND_SUBMISSION_SUBMIT" });
  }

  return (
    <Button
      className={styles.button}
      surfaceClassName={styles.surface}
      onClick={handleClick}
      disabled={!isValid}
      testId="submission-button"
    >
      <Hills3
        className={`${styles.motif} ${styles.motifLeft}`}
        aria-hidden="true"
        focusable="false"
      />
      <ButtonText className={styles.text} ariaLabel="도전">
        도전
      </ButtonText>
      <Hills2
        className={`${styles.motif} ${styles.motifRight}`}
        aria-hidden="true"
        focusable="false"
      />
    </Button>
  );
}
