/**
 * @file types.ts
 *
 * Engine-owned types: evaluation results, validation, and scoring.
 *
 * All types are pure data. No React. No side effects.
 */

export type CharacterResult = "correct" | "present" | "absent";

export type EvaluatedCharacter = {
  character: string; // resolved syllable string, or '' for an empty slot
  result: CharacterResult;
};

export type GuessRecord = readonly EvaluatedCharacter[];

export type ValidationFailureReason =
  | "NO_CHARACTERS" // no slots filled at all
  | "INCOMPLETE_CHARACTER"; // at least one filled slot has an incomplete character

export type ValidationResult = { valid: true } | { valid: false; reason: ValidationFailureReason };

export type ScoringResult = {
  guessCount: number;
};
