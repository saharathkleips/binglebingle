/**
 * @file round-actions.ts
 *
 * Handlers for round-progression actions: ROUND_SUBMISSION_SUBMIT, ROUND_RESET.
 * Also exports pool/submission builders shared with createInitialGameState.
 * No React. No side effects.
 */

import { fullDecompose, normalizeCharacter } from "../../lib/character/character";
import { evaluateGuess } from "../../lib/engine/evaluate";
import type { Word } from "../../lib/word/word";
import type { GameState, SubmissionSlot, Tile } from "./game";

// ---------------------------------------------------------------------------
// Shared builders (also used by createInitialGameState in game-reducer.ts)
// ---------------------------------------------------------------------------

/**
 * Builds the initial jamo pool from a word by fully decomposing and normalizing
 * each character to its rotation base. Normalization prevents the pool from
 * revealing which rotation target the word uses.
 *
 * @param word - The target word to decompose
 * @returns An ordered pool of single-jamo tiles
 */
export function buildInitialPool(word: Word): readonly Tile[] {
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
export function buildEmptySubmission(word: Word): readonly SubmissionSlot[] {
  return word.map(() => ({ state: "EMPTY" as const }));
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Evaluates the current submission against the target word and records the result.
 * Correct and present slots remain filled; absent tiles are fully decomposed
 * (without normalizing) and returned to the pool.
 *
 * @param state - Current game state
 * @returns Next game state
 */
export function handleSubmitGuess(state: GameState): GameState {
  const evaluation = evaluateGuess(
    state.submission.map((slot) => (slot.state === "FILLED" ? slot.character : null)),
    state.targetWord,
  );

  // Zip each slot with its evaluation result for use in the steps below.
  const pairs = state.submission.map((slot, i) => ({ slot, result: evaluation[i]?.result }));

  // Correct and present slots remain filled; absent slots are cleared.
  const newSubmission: readonly SubmissionSlot[] = pairs.map(({ slot, result }) =>
    slot.state === "FILLED" && result !== "CORRECT" && result !== "PRESENT"
      ? { state: "EMPTY" as const }
      : slot,
  );

  // Collect the tiles being returned to the pool.
  const absentTiles: Tile[] = pairs.flatMap(({ slot, result }) =>
    slot.state === "FILLED" && result !== "CORRECT" && result !== "PRESENT"
      ? [{ id: slot.tileId, character: slot.character }]
      : [],
  );

  // Fully decompose absent tiles without normalizing. A composed jamo (e.g. ㄲ)
  // expands to its parts (ㄱ, ㄱ); extra parts from decomposition get fresh IDs.
  const usedIds = new Set([
    ...state.pool.map((t) => t.id),
    ...absentTiles.map((t) => t.id),
    ...newSubmission.flatMap((s) => (s.state === "FILLED" ? [s.tileId] : [])),
  ]);
  const decomposedTiles = absentTiles.flatMap(({ id, character }) => {
    const parts = fullDecompose([character]);
    return parts.map((char, partIndex) => {
      if (partIndex === 0) return { id, character: char };
      let newId = 0;
      while (usedIds.has(newId)) newId++;
      usedIds.add(newId);
      return { id: newId, character: char };
    });
  });

  return {
    ...state,
    history: [...state.history, evaluation],
    pool: [...state.pool, ...decomposedTiles],
    submission: newSubmission,
  };
}

/**
 * Restores the pool from the word and clears all submission slots.
 * Does not append to history.
 *
 * @param state - Current game state
 * @returns Next game state with fresh pool and empty submission
 */
export function handleResetRound(state: GameState): GameState {
  return {
    ...state,
    pool: buildInitialPool(state.targetWord),
    submission: buildEmptySubmission(state.targetWord),
  };
}
