/**
 * @file types.ts
 *
 * Game state types: pool, submission, and the top-level GameState/GameAction.
 *
 * No React. No side effects.
 */

import type { GuessRecord } from "../lib/engine/types";
import type { Word } from "../lib/word/word";
import type { Character } from "../lib/character/character";

export type PoolToken = {
  id: number; // stable index into original pool array — never changes
  character: Character;
};

export type PoolState = readonly PoolToken[];

export type SubmissionSlot =
  | { filled: true; tokenId: number; character: Character }
  | { filled: false };

export type SubmissionState = readonly SubmissionSlot[]; // length always === [...word].length

export type GameState = {
  word: Word;
  pool: PoolState;
  submission: SubmissionState;
  guesses: readonly GuessRecord[];
};

export type GameAction =
  | { type: "ROTATE_TOKEN"; payload: { tokenId: number; targetJamo: string } }
  | { type: "COMBINE_TOKENS"; payload: { tokenIdA: number; tokenIdB: number } }
  | { type: "SPLIT_TOKEN"; payload: { tokenId: number } }
  | { type: "PLACE_TOKEN"; payload: { tokenId: number; slotIndex: number } }
  | { type: "REMOVE_FROM_SLOT"; payload: { slotIndex: number } }
  | { type: "SUBMIT_GUESS"; payload: { evaluation: GuessRecord } }
  | { type: "RESET_ROUND" };
