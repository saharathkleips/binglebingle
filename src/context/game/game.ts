/**
 * @file game.ts
 *
 * Game state types: pool, submission, and the top-level GameState/GameAction.
 *
 * No React. No side effects.
 */

import type { GuessRecord } from "../../lib/engine/engine";
import type { Word } from "../../lib/word/word";
import type { Character } from "../../lib/character/character";

/**
 * A single tile in the player's jamo pool.
 *
 * @property id - Stable index into the original pool array; never changes even
 *   as `character` mutates through rotate, combine, or split actions.
 * @property character - The current jamo character represented by this tile.
 */
export type PoolToken = {
  id: number;
  character: Character;
};

/** The full set of jamo tiles available to the player during a round. */
export type PoolState = readonly PoolToken[];

/**
 * A single slot in the player's current guess submission.
 * A filled slot holds a reference back to its source pool token so that
 * mutations to the token (e.g. rotation) are reflected in the submission.
 */
export type SubmissionSlot =
  | { state: "FILLED"; tokenId: number; character: Character }
  | { state: "EMPTY" };

/**
 * The ordered sequence of submission slots for the current guess.
 * Length is always equal to the number of characters in `GameState.word`.
 */
export type SubmissionState = readonly SubmissionSlot[];

/**
 * Top-level game state for a single round.
 *
 * @property word - The target word the player is trying to guess.
 * @property pool - The jamo tiles currently available to the player.
 * @property submission - The player's current in-progress guess.
 * @property guesses - All evaluated guesses submitted so far this round.
 */
export type GameState = {
  word: Word;
  pool: PoolState;
  submission: SubmissionState;
  guesses: readonly GuessRecord[];
};

/**
 * Actions that operate on pool tokens: rotating jamo, composing two tokens into
 * one, or decomposing a token back into its constituents.
 *
 * - `CHARACTER_ROTATE_NEXT` — advance a token's jamo to the next member of its rotation set
 * - `CHARACTER_COMPOSE` — merge two tokens into a double consonant or complex vowel
 * - `CHARACTER_DECOMPOSE` — split a composed token back into its constituent tokens
 */
export type CharacterAction =
  | { type: "CHARACTER_ROTATE_NEXT"; payload: { tokenId: number } }
  | { type: "CHARACTER_COMPOSE"; payload: { targetId: number; incomingId: number } }
  | { type: "CHARACTER_DECOMPOSE"; payload: { tokenId: number } };

/**
 * Actions for moving tokens between the pool and submission slots.
 *
 * - `SUBMISSION_SLOT_INSERT` — move a token from the pool into a submission slot
 * - `SUBMISSION_SLOT_REMOVE` — return the token in a slot back to the pool
 * - `SUBMISSION_SLOT_MOVE` — move a token from one submission slot to another
 */
export type SubmissionAction =
  | { type: "SUBMISSION_SLOT_INSERT"; payload: { tokenId: number; slotIndex: number } }
  | { type: "SUBMISSION_SLOT_REMOVE"; payload: { slotIndex: number } }
  | { type: "SUBMISSION_SLOT_MOVE"; payload: { fromSlotIndex: number; toSlotIndex: number } };

/**
 * All actions that can be dispatched to the game reducer.
 *
 * - `CHARACTER_ROTATE_NEXT` — advance a token's jamo to the next member of its rotation set
 * - `CHARACTER_COMPOSE` — merge two tokens into a double consonant or complex vowel
 * - `CHARACTER_DECOMPOSE` — split a composed token back into its constituent tokens
 * - `SUBMISSION_SLOT_INSERT` — move a token from the pool into a submission slot
 * - `SUBMISSION_SLOT_REMOVE` — return the token in a slot back to the pool
 * - `SUBMISSION_SLOT_MOVE` — move a token from one submission slot to another
 * - `SUBMIT_GUESS` — record an evaluated guess and clear the submission
 * - `RESET_ROUND` — restore the pool and clear the submission for a new attempt
 */
export type GameAction =
  | CharacterAction
  | SubmissionAction
  | { type: "SUBMIT_GUESS"; payload: { evaluation: GuessRecord } }
  | { type: "RESET_ROUND" };
