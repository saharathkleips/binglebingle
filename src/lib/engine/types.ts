/**
 * @file types.ts
 *
 * Engine-owned types: evaluation results, validation, and scoring.
 *
 * All types are pure data. No React. No side effects.
 */

/** Per-character evaluation result for a submitted guess. */
export type CharacterResult = "correct" | "present" | "absent";

/**
 * The evaluation of a single submission slot.
 *
 * @property character - The resolved syllable string for the slot, or `''` for an empty slot.
 *   UI can distinguish empty-slot absent from wrong-character absent by checking `character === ''`.
 * @property result - The evaluation result for this slot.
 */
export type EvaluatedCharacter = {
  character: string;
  result: CharacterResult;
};

/** A fully evaluated guess — one `EvaluatedCharacter` per submission slot. */
export type GuessRecord = readonly EvaluatedCharacter[];

/**
 * Reason a submission failed validation.
 *
 * - `NO_CHARACTERS` — no slots are filled at all
 * - `INCOMPLETE_CHARACTER` — at least one filled slot has an incomplete character
 */
export type ValidationFailureReason = "NO_CHARACTERS" | "INCOMPLETE_CHARACTER";

/** Result of validating a submission before dispatch. */
export type ValidationResult = { valid: true } | { valid: false; reason: ValidationFailureReason };

/**
 * Scoring output for a completed game.
 *
 * @property guessCount - The number of guesses taken. MVP scoring only; typed for extensibility.
 */
export type ScoringResult = {
  guessCount: number;
};
