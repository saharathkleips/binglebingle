/**
 * @file scoring.ts
 *
 * Score calculation for the engine slice.
 *
 * All functions are pure. No React. No side effects.
 */

import type { EvaluatedCharacter, GuessRecord, ScoringResult } from ".";

/**
 * Returns true when the player has won: the last guess record exists and
 * every evaluated character in it is marked CORRECT.
 *
 * @param history - The list of guess records for the game so far
 * @returns Whether the player has won
 */
export function isWon(history: readonly GuessRecord[]): boolean {
  const lastGuess = history[history.length - 1];
  return (
    lastGuess !== undefined &&
    lastGuess.every((entry: EvaluatedCharacter) => entry.result === "CORRECT")
  );
}

/**
 * Calculates the score based on the number of guesses made.
 *
 * @param guesses - The list of guess records for the completed game
 * @returns A ScoringResult containing the guess count
 */
export function calculateScore(guesses: readonly GuessRecord[]): ScoringResult {
  return { guessCount: guesses.length };
}
