/**
 * @file validate.ts
 *
 * Submission validation for the engine slice.
 *
 * All functions are pure. No React. No side effects.
 */

import { isComplete } from "../character/character";
import type { SubmissionState } from "../../state/types";
import type { ValidationResult } from "./types";

/**
 * Checks whether the current submission is valid to submit.
 *
 * Returns `{ valid: true }` when at least one slot is filled and every filled
 * slot contains a complete Korean syllable block. Does not check whether the
 * guess forms a real word, whether all slots are filled, or whether characters
 * are constructible from the pool.
 *
 * @param submission - The current submission state
 * @returns A ValidationResult indicating validity or the failure reason
 */
export function canSubmit(submission: SubmissionState): ValidationResult {
  const filledSlots = submission.filter((slot) => slot.filled);

  if (filledSlots.length === 0) {
    return { valid: false, reason: "NO_CHARACTERS" };
  }

  const hasIncomplete = filledSlots.some((slot) => slot.filled && !isComplete(slot.character));

  if (hasIncomplete) {
    return { valid: false, reason: "INCOMPLETE_CHARACTER" };
  }

  return { valid: true };
}
