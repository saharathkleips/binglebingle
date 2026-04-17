/**
 * @file scoring.ts
 *
 * Score calculation for the engine slice.
 *
 * All functions are pure. No React. No side effects.
 */

import type { GuessRecord, ScoringResult } from "./index";

/**
 * Calculates the score based on the number of guesses made.
 *
 * @param guesses - The list of guess records for the completed game
 * @returns A ScoringResult containing the guess count
 */
export function calculateScore(guesses: readonly GuessRecord[]): ScoringResult {
  return { guessCount: guesses.length };
}
