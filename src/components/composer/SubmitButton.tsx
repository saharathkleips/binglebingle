/**
 * @file SubmitButton.tsx
 *
 * Validates the current submission and dispatches ROUND_SUBMISSION_SUBMIT.
 */

import { type Dispatch } from "react";
import { canSubmit } from "../../lib/engine/validate";
import type { SubmissionSlot, GameAction } from "../../context/game";

export type SubmitButtonProps = {
  submission: readonly SubmissionSlot[];
  dispatch: Dispatch<GameAction>;
};

export function SubmitButton({ submission, dispatch }: SubmitButtonProps) {
  const validation = canSubmit(submission);
  const isValid = validation === "VALID";

  function handleClick() {
    if (isValid) {
      dispatch({ type: "ROUND_SUBMISSION_SUBMIT" });
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={!isValid} data-testid="submit-button">
      Submit
    </button>
  );
}
