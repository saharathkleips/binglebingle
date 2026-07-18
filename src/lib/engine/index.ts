/**
 * @file engine.ts
 *
 * Engine-owned types: evaluation results, validation, and scoring.
 *
 * All types are pure data. No React. No side effects.
 */

import type { Character } from "../character";

/**
 * A guess submission as seen by the engine: one Character per slot, or null
 * for an empty slot. Positional — slot index corresponds to word position.
 */
export type Submission = readonly (Character | null)[];

/** Per-character evaluation result for a submitted guess. */
export type CharacterResult = "CORRECT" | "PRESENT" | "ABSENT";

/** The evaluation of a single submission slot. */
export type EvaluatedCharacter = {
  /** Character placed in this slot; absent when the slot was empty. */
  character?: Character;
  /** Evaluation result for this slot. */
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

/** Scoring output for a completed game. */
export type ScoringResult = {
  /** Number of guesses taken. MVP scoring only; typed for extensibility. */
  guessCount: number;
};
