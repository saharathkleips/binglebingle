/**
 * @file round-actions.ts
 *
 * Handlers for round-progression actions: SUBMIT_GUESS, RESET_ROUND.
 * Also exports pool/submission builders shared with createInitialGameState.
 * No React. No side effects.
 */

import { normalizeCharacter } from "../../lib/character/character";
import { fullDecompose } from "../../lib/puzzle/puzzle";
import type { Word } from "../../lib/word/word";
import type { GuessRecord } from "../../lib/engine/engine";
import type { GameState, PoolState, SubmissionState, PoolToken } from "./game";

// ---------------------------------------------------------------------------
// Shared builders (also used by createInitialGameState in game-reducer.ts)
// ---------------------------------------------------------------------------

/**
 * Builds the initial jamo pool from a word by fully decomposing and normalizing
 * each character to its rotation base. Normalization prevents the pool from
 * revealing which rotation target the word uses.
 *
 * @param word - The target word to decompose
 * @returns An ordered pool of single-jamo tokens
 */
export function buildInitialPool(word: Word): PoolState {
  return fullDecompose(word).map((char, index) => ({
    id: index,
    character: normalizeCharacter(char),
  }));
}

/**
 * Builds an all-empty submission state sized to match the word length.
 *
 * @param word - The target word whose length determines the submission size
 * @returns An array of EMPTY submission slots
 */
export function buildEmptySubmission(word: Word): SubmissionState {
  return word.map(() => ({ state: "EMPTY" as const }));
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Appends a pre-computed evaluation to guesses. Correct slots remain filled;
 * present/absent tokens are returned to the pool.
 * Reducer does not compute evaluation — that is the engine's job.
 *
 * @param state - Current game state
 * @param payload - Pre-computed GuessRecord to record
 * @returns Next game state
 */
export function handleSubmitGuess(
  state: GameState,
  payload: { evaluation: GuessRecord },
): GameState {
  const { evaluation } = payload;
  const returnedTokens: PoolToken[] = [];
  const newSubmission: SubmissionState = state.submission.map((slot, i) => {
    if (slot.state !== "FILLED") return slot;
    // Correct slots remain filled; present/absent tokens return to the pool
    if (evaluation[i]?.result === "CORRECT") return slot;
    returnedTokens.push({ id: slot.tokenId, character: slot.character });
    return { state: "EMPTY" as const };
  });
  return {
    ...state,
    guesses: [...state.guesses, evaluation],
    pool: [...state.pool, ...returnedTokens],
    submission: newSubmission,
  };
}

/**
 * Restores the pool from the word and clears all submission slots.
 * Does not append to guesses.
 *
 * @param state - Current game state
 * @returns Next game state with fresh pool and empty submission
 */
export function handleResetRound(state: GameState): GameState {
  return {
    ...state,
    pool: buildInitialPool(state.word),
    submission: buildEmptySubmission(state.word),
  };
}
