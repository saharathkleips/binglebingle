/**
 * @file validate.ts
 *
 * Submission validation for the engine slice.
 *
 * All functions are pure. No React. No side effects.
 */

import { isComplete } from "../character/character";
import type { SubmissionSlot } from "../../context/game/game";
import type { ValidationResult } from "./engine";

/**
 * Checks whether the current submission is valid to submit.
 *
 * Returns `"VALID"` when at least one slot is filled and every filled
 * slot contains a complete Korean syllable block. Does not check whether the
 * guess forms a real word, whether all slots are filled, or whether characters
 * are constructible from the pool.
 *
 * @param submission - The current submission state
 * @returns A ValidationResult — `"VALID"` or the specific failure reason
 */
export function canSubmit(submission: readonly SubmissionSlot[]): ValidationResult {
  const filledSlots = submission.filter((slot) => slot.state === "FILLED");

  if (filledSlots.length === 0) {
    return "NO_CHARACTERS";
  }

  const hasIncomplete = filledSlots.some(
    (slot) => slot.state === "FILLED" && !isComplete(slot.character),
  );

  if (hasIncomplete) {
    return "INCOMPLETE_CHARACTER";
  }

  return "VALID";
}
