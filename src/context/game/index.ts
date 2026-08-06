/**
 * @file index.ts
 *
 * Game state types: pool, submission, and the top-level GameState/GameAction.
 *
 * No React. No side effects.
 */

import type { GuessRecord } from "../../lib/engine";
import type { Word } from "../../lib/word";
import type { Character } from "../../lib/character";

/** A single tile in the player's jamo pool. */
export type Tile = {
  /** Stable tile identity; persists as `character` mutates through rotate, compose, or decompose actions. */
  id: number;
  /** Current jamo or syllable block represented by this tile. */
  character: Character;
};

/**
 * A single slot in the player's current guess submission.
 * A filled slot holds a reference back to its source tile so that
 * mutations to the tile (e.g. rotation) are reflected in the submission.
 */
export type SubmissionSlot =
  | {
      /** Filled slots participate in validation and submission evaluation. */
      state: "FILLED";
      /** ID of the source tile occupying this slot. */
      tileId: number;
      /** Snapshot of the tile character currently shown in this slot. */
      character: Character;
    }
  | {
      /** Empty slots render as drop targets and block full-word submission. */
      state: "EMPTY";
    };

/** Top-level game state for a single round. */
export type GameState = {
  /** Target word the player is trying to guess. */
  targetWord: Word;
  /** Tiles currently available in the player's pool. */
  pool: readonly Tile[];
  /** Player's current in-progress guess, aligned positionally with `targetWord`. */
  submission: readonly SubmissionSlot[];
  /** Evaluated guesses submitted so far this round. */
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

/** Precomputed submit transition fields needed to commit a submitted guess. */
export type SubmitGuessCommitPayload = {
  /** Per-slot evaluation for the submitted guess. */
  evaluation: GuessRecord;
  /** Submission after correct slots are kept and present/absent slots are cleared. */
  submission: readonly SubmissionSlot[];
  /** Pool after present tiles return unchanged and absent tiles return decomposed. */
  pool: readonly Tile[];
};

/**
 * Actions for round progression: submitting a guess, committing an already prepared submit
 * transition, or resetting the round.
 *
 * - `ROUND_SUBMISSION_SUBMIT` — evaluate the current submission, record the result; correct slots
 *   remain filled, present tiles return unchanged, absent tiles return fully decomposed
 * - `ROUND_SUBMISSION_COMMIT` — commit a precomputed submit transition produced by domain logic
 * - `ROUND_RESET` — restore the pool and clear the submission for a new attempt
 */
export type RoundAction =
  | { type: "ROUND_SUBMISSION_SUBMIT" }
  | {
      type: "ROUND_SUBMISSION_COMMIT";
      /** Precomputed domain transition to apply exactly once. */
      payload: SubmitGuessCommitPayload;
    }
  | { type: "ROUND_RESET" };

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
 * - `ROUND_SUBMISSION_COMMIT` — commit a precomputed submit transition
 * - `ROUND_RESET` — restore the pool and clear the submission for a new attempt
 */
export type GameAction = CharacterAction | SubmissionAction | RoundAction;
