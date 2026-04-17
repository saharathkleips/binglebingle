/**
 * @file game.ts
 *
 * Game state types: pool, submission, and the top-level GameState/GameAction.
 *
 * No React. No side effects.
 */

import type { GuessRecord } from "../../lib/engine";
import type { Word } from "../../lib/word";
import type { Character } from "../../lib/character";

/**
 * A single tile in the player's jamo pool.
 *
 * @property id - Stable index into the original pool array; never changes even
 *   as `character` mutates through rotate, combine, or split actions.
 * @property character - The current jamo character represented by this tile.
 */
export type Tile = {
  id: number;
  character: Character;
};

/**
 * A single slot in the player's current guess submission.
 * A filled slot holds a reference back to its source tile so that
 * mutations to the tile (e.g. rotation) are reflected in the submission.
 */
export type SubmissionSlot =
  | { state: "FILLED"; tileId: number; character: Character }
  | { state: "EMPTY" };

/**
 * Top-level game state for a single round.
 *
 * @property targetWord - The target word the player is trying to guess.
 * @property pool - The jamo tiles currently available to the player.
 * @property submission - The player's current in-progress guess.
 * @property history - All evaluated guesses submitted so far this round.
 */
export type GameState = {
  targetWord: Word;
  pool: readonly Tile[];
  submission: readonly SubmissionSlot[];
  history: readonly GuessRecord[];
};

/**
 * Actions that operate on pool tokens: rotating jamo, composing two tokens into
 * one, or decomposing a token back into its constituents.
 *
 * - `CHARACTER_ROTATE_NEXT` — advance a tile's jamo to the next member of its rotation set
 * - `CHARACTER_COMPOSE` — merge two tiles into a double consonant or complex vowel
 * - `CHARACTER_DECOMPOSE` — split a composed tile back into its constituent tiles
 */
export type CharacterAction =
  | { type: "CHARACTER_ROTATE_NEXT"; payload: { tileId: number } }
  | { type: "CHARACTER_COMPOSE"; payload: { targetId: number; incomingId: number } }
  | { type: "CHARACTER_DECOMPOSE"; payload: { tileId: number } };

/**
 * Actions for moving tiles between the pool and submission slots.
 *
 * - `SUBMISSION_SLOT_INSERT` — move a tile from the pool into a submission slot
 * - `SUBMISSION_SLOT_REMOVE` — return the tile in a slot back to the pool
 * - `SUBMISSION_SLOT_MOVE` — move a tile from one submission slot to another
 */
export type SubmissionAction =
  | { type: "SUBMISSION_SLOT_INSERT"; payload: { tileId: number; slotIndex: number } }
  | { type: "SUBMISSION_SLOT_REMOVE"; payload: { slotIndex: number } }
  | { type: "SUBMISSION_SLOT_MOVE"; payload: { fromSlotIndex: number; toSlotIndex: number } };

/**
 * Actions for round progression: submitting a guess or resetting the round.
 *
 * - `ROUND_SUBMISSION_SUBMIT` — evaluate the current submission, record the result; correct/present
 *   slots remain filled, absent tiles are fully decomposed and returned to the pool
 * - `ROUND_RESET` — restore the pool and clear the submission for a new attempt
 */
export type RoundAction = { type: "ROUND_SUBMISSION_SUBMIT" } | { type: "ROUND_RESET" };

/**
 * All actions that can be dispatched to the game reducer.
 *
 * - `CHARACTER_ROTATE_NEXT` — advance a tile's jamo to the next member of its rotation set
 * - `CHARACTER_COMPOSE` — merge two tiles into a double consonant or complex vowel
 * - `CHARACTER_DECOMPOSE` — split a composed tile back into its constituent tiles
 * - `SUBMISSION_SLOT_INSERT` — move a tile from the pool into a submission slot
 * - `SUBMISSION_SLOT_REMOVE` — return the tile in a slot back to the pool
 * - `SUBMISSION_SLOT_MOVE` — move a tile from one submission slot to another
 * - `ROUND_SUBMISSION_SUBMIT` — record an evaluated guess and update slots by result
 * - `ROUND_RESET` — restore the pool and clear the submission for a new attempt
 */
export type GameAction = CharacterAction | SubmissionAction | RoundAction;
