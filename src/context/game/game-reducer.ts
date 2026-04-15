/**
 * @file game-reducer.ts
 *
 * Pure game reducer and initial state factory for Binglebingle.
 * No async, no side effects.
 */

import { compose, decompose, character, normalizeCharacter } from "../../lib/character/character";
import type { Character } from "../../lib/character/character";
import { fullDecompose } from "../../lib/puzzle/puzzle";
import type { Jamo } from "../../lib/jamo/jamo";
import type { Word } from "../../lib/word/word";
import type { GameState, GameAction, PoolToken, PoolState, SubmissionState } from "./game";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Builds the initial jamo pool from a word by fully decomposing and normalizing
 * each character to its rotation base. Normalization prevents the pool from
 * revealing which rotation target the word uses.
 */
function buildInitialPool(word: Word): PoolState {
  return fullDecompose(word).map((char, index) => ({
    id: index,
    character: normalizeCharacter(char),
  }));
}

/**
 * Builds an all-empty submission state sized to match the word length.
 */
function buildEmptySubmission(word: Word): SubmissionState {
  return word.map(() => ({ state: "EMPTY" as const }));
}

/**
 * Applies a jamo rotation to a single-jamo Character by replacing its jamo
 * with targetJamo while preserving the slot kind (choseong / jungseong / jongseong).
 * Returns null if the character is not single-jamo or the result is invalid.
 */
function rotateSingleJamoCharacter(char: Character, targetJamo: Jamo): Character | null {
  switch (char.kind) {
    case "CHOSEONG_ONLY":
      return character({ choseong: targetJamo });
    case "JUNGSEONG_ONLY":
      return character({ jungseong: targetJamo });
    case "JONGSEONG_ONLY":
      return character({ jongseong: targetJamo });
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

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
    word,
    pool: buildInitialPool(word),
    submission: buildEmptySubmission(word),
    guesses: [],
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
    case "ROTATE_TOKEN": {
      const { tokenId, targetJamo } = action.payload;
      const token = state.pool.find((t) => t.id === tokenId);
      if (token === undefined) return state;
      // Cast is safe: the character factory validates the jamo and returns null for invalid input
      const newChar = rotateSingleJamoCharacter(token.character, targetJamo as Jamo);
      if (newChar === null) return state;
      return {
        ...state,
        pool: state.pool.map((t) => (t.id === tokenId ? { ...t, character: newChar } : t)),
      };
    }

    case "COMBINE_TOKENS": {
      const { tokenIdA, tokenIdB } = action.payload;
      const tokenA = state.pool.find((t) => t.id === tokenIdA);
      const tokenB = state.pool.find((t) => t.id === tokenIdB);
      if (tokenA === undefined || tokenB === undefined) return state;
      // compose() handles both single-jamo pool combination and jongseong upgrade
      const combined = compose(tokenA.character, tokenB.character);
      if (combined === null) return state;
      return {
        ...state,
        pool: state.pool
          .filter((t) => t.id !== tokenIdB)
          .map((t) => (t.id === tokenIdA ? { ...t, character: combined } : t)),
      };
    }

    case "SPLIT_TOKEN": {
      const { tokenId } = action.payload;
      const token = state.pool.find((t) => t.id === tokenId);
      if (token === undefined) return state;
      const parts = decompose(token.character);
      // A single-jamo character decomposes to itself — nothing to split
      if (parts.length <= 1) return state;
      // Expand the token in place, then reassign all ids from scratch (S2)
      const expanded: Character[] = state.pool.flatMap((t) =>
        t.id === tokenId ? parts : [t.character],
      );
      const newPool: PoolState = expanded.map((char, index) => ({ id: index, character: char }));
      return { ...state, pool: newPool };
    }

    case "PLACE_TOKEN": {
      const { tokenId, slotIndex } = action.payload;
      const token = state.pool.find((t) => t.id === tokenId);
      if (token === undefined || slotIndex < 0 || slotIndex >= state.submission.length) {
        return state;
      }
      const existingSlot = state.submission[slotIndex];
      // If the slot is already filled, return the existing token to the pool first
      const poolBeforePlace: readonly PoolToken[] =
        existingSlot?.state === "FILLED"
          ? [...state.pool, { id: existingSlot.tokenId, character: existingSlot.character }]
          : state.pool;
      return {
        ...state,
        pool: poolBeforePlace.filter((t) => t.id !== tokenId),
        submission: state.submission.map((slot, i) =>
          i === slotIndex
            ? { state: "FILLED" as const, tokenId: token.id, character: token.character }
            : slot,
        ),
      };
    }

    case "REMOVE_FROM_SLOT": {
      const { slotIndex } = action.payload;
      const slot = state.submission[slotIndex];
      if (slot === undefined || slot.state !== "FILLED") return state;
      return {
        ...state,
        pool: [...state.pool, { id: slot.tokenId, character: slot.character }],
        submission: state.submission.map((s, i) =>
          i === slotIndex ? { state: "EMPTY" as const } : s,
        ),
      };
    }

    case "SUBMIT_GUESS": {
      const { evaluation } = action.payload;
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

    case "RESET_ROUND": {
      return {
        ...state,
        pool: buildInitialPool(state.word),
        submission: buildEmptySubmission(state.word),
      };
    }
  }
}
