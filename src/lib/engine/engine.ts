/**
 * @file engine.ts
 *
 * Engine-owned types: evaluation results, validation, and scoring.
 *
 * All types are pure data. No React. No side effects.
 */

import type { Character } from "../character/character";

/**
 * A guess submission as seen by the engine: one Character per slot, or null
 * for an empty slot. Positional — slot index corresponds to word position.
 */
export type Submission = readonly (Character | null)[];

/** Per-character evaluation result for a submitted guess. */
export type CharacterResult = "CORRECT" | "PRESENT" | "ABSENT";

/**
 * The evaluation of a single submission slot.
 *
 * @property character - The Character placed in this slot. Absent when the slot was empty —
 *   absence signals "no tile placed here" rather than an invalid or failed state.
 * @property result - The evaluation result for this slot.
 */
export type EvaluatedCharacter = {
  character?: Character;
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

/** Result of validating a submission before dispatch. `"VALID"` or the specific failure reason. */
export type ValidationResult = "VALID" | ValidationFailureReason;

/**
 * Scoring output for a completed game.
 *
 * @property guessCount - The number of guesses taken. MVP scoring only; typed for extensibility.
 */
export type ScoringResult = {
  guessCount: number;
};
