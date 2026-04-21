/**
 * @file SubmissionButton.tsx
 *
 * Validates the current submission and dispatches ROUND_SUBMISSION_SUBMIT.
 */

import { type Dispatch } from "react";
import { canSubmit } from "../../lib/engine/validate";
import type { SubmissionSlot, GameAction } from "../../context/game";

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
    if (isValid) {
      dispatch({ type: "ROUND_SUBMISSION_SUBMIT" });
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={!isValid} data-testid="submission-button">
      Submit
    </button>
  );
}
