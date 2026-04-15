/**
 * @file character-actions.ts
 *
 * Handlers for character-composition actions: ROTATE_TOKEN, COMBINE_TOKENS, SPLIT_TOKEN.
 * No React. No side effects.
 */

import { compose, decompose, character } from "../../lib/character/character";
import type { Character } from "../../lib/character/character";
import type { Jamo } from "../../lib/jamo/jamo";
import type { GameState, PoolState } from "./game";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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
// Handlers
// ---------------------------------------------------------------------------

/**
 * Changes a single-jamo pool token's jamo to targetJamo.
 * No-op if the token is not found or is not a single-jamo character.
 *
 * @param state - Current game state
 * @param payload - tokenId and targetJamo to apply
 * @returns Next game state
 */
export function handleRotateToken(
  state: GameState,
  payload: { tokenId: number; targetJamo: string },
): GameState {
  const { tokenId, targetJamo } = payload;
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

/**
 * Merges two pool tokens into one using compose(). The combined token takes
 * the id of tokenIdA; tokenIdB is removed from the pool.
 * No-op if either token is not found or compose() returns null.
 *
 * @param state - Current game state
 * @param payload - tokenIdA and tokenIdB to combine
 * @returns Next game state
 */
export function handleCombineTokens(
  state: GameState,
  payload: { tokenIdA: number; tokenIdB: number },
): GameState {
  const { tokenIdA, tokenIdB } = payload;
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

/**
 * Decomposes a multi-jamo pool token back into individual single-jamo tokens.
 * All pool token ids are reassigned from scratch (0, 1, 2, …) after split.
 * No-op if the token has only one jamo or is not found.
 *
 * @param state - Current game state
 * @param payload - tokenId to split
 * @returns Next game state
 */
export function handleSplitToken(state: GameState, payload: { tokenId: number }): GameState {
  const { tokenId } = payload;
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
