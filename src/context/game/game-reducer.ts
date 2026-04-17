/**
 * @file game-reducer.ts
 *
 * Pure game reducer and initial state factory for Binglebingle.
 * Delegates action handling to focused handler modules.
 * No async, no side effects.
 */

import type { Word } from "../../lib/word";
import type { GameState, GameAction } from ".";
import {
  handleCharacterRotateNext,
  handleCharacterCompose,
  handleCharacterDecompose,
} from "./character-actions";
import {
  handleSubmissionSlotInsert,
  handleSubmissionSlotMove,
  handleSubmissionSlotRemove,
} from "./submission-actions";
import {
  handleSubmitGuess,
  handleResetRound,
  buildInitialPool,
  buildEmptySubmission,
} from "./round-actions";

/**
 * Creates the initial GameState for a given word.
 * The jamo pool is built by fully decomposing each syllable and normalizing
 * each jamo to the canonical member of its rotation set.
 *
 * @param word - The target word the player will guess
 * @returns The initial GameState with a full pool and empty submission
 */
export function createInitialGameState(word: Word): GameState {
  return {
    targetWord: word,
    pool: buildInitialPool(word),
    submission: buildEmptySubmission(word),
    history: [],
  };
}

/**
 * Pure reducer that applies a GameAction to the current GameState.
 * Returns state unchanged for invalid or no-op actions (e.g. rotating a
 * non-rotatable jamo, combining incompatible tokens).
 *
 * @param state - Current game state
 * @param action - Action to apply
 * @returns The next game state
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "CHARACTER_ROTATE_NEXT":
      return handleCharacterRotateNext(state, action.payload);
    case "CHARACTER_COMPOSE":
      return handleCharacterCompose(state, action.payload);
    case "CHARACTER_DECOMPOSE":
      return handleCharacterDecompose(state, action.payload);
    case "SUBMISSION_SLOT_INSERT":
      return handleSubmissionSlotInsert(state, action.payload);
    case "SUBMISSION_SLOT_MOVE":
      return handleSubmissionSlotMove(state, action.payload);
    case "SUBMISSION_SLOT_REMOVE":
      return handleSubmissionSlotRemove(state, action.payload);
    case "ROUND_SUBMISSION_SUBMIT":
      return handleSubmitGuess(state);
    case "ROUND_RESET":
      return handleResetRound(state);
  }
}
