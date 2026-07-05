/**
 * @file SubmissionButton.tsx
 *
 * Validates the current submission and dispatches ROUND_SUBMISSION_SUBMIT.
 */

import { type Dispatch } from "react";
import { canSubmit } from "../../lib/engine/validate";
import type { SubmissionSlot, GameAction } from "../../context/game";
import Hills2 from "./hills-2.svg?react";
import Hills3 from "./hills-3.svg?react";
import styles from "./SubmissionButton.module.css";

/**
 * @property submission - The current submission slots to validate.
 * @property dispatch - Game dispatch function.
 * @property onSubmitStart - Optional callback fired just before the submit dispatch; used to trigger slot animations.
 */
export type SubmissionButtonProps = {
  submission: readonly SubmissionSlot[];
  dispatch: Dispatch<GameAction>;
  onSubmitStart?: () => void;
};

/**
 * Validates the current submission and dispatches ROUND_SUBMISSION_SUBMIT on click.
 *
 * @param props - {@link SubmissionButtonProps}
 */
export function SubmissionButton({ submission, dispatch, onSubmitStart }: SubmissionButtonProps) {
  const isValid = canSubmit(submission) === "VALID";

  function handleClick() {
    if (isValid) {
      onSubmitStart?.();
      dispatch({ type: "ROUND_SUBMISSION_SUBMIT" });
    }
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      disabled={!isValid}
      data-testid="submission-button"
    >
      <span className={styles.surface}>
        <Hills3
          className={`${styles.motif} ${styles.motifLeft}`}
          aria-hidden="true"
          focusable="false"
        />
        <span className={styles.text} aria-label="도전">
          <span className={styles.textDepth} aria-hidden="true">
            도전
          </span>
          <span className={styles.textStroke} aria-hidden="true">
            도전
          </span>
          <span className={styles.textLabel} aria-hidden="true">
            도전
          </span>
        </span>
        <Hills2
          className={`${styles.motif} ${styles.motifRight}`}
          aria-hidden="true"
          focusable="false"
        />
      </span>
    </button>
  );
}
