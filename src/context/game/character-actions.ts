/**
 * @file character-actions.ts
 *
 * Handlers for character-composition actions: CHARACTER_ROTATE_NEXT, CHARACTER_COMPOSE, CHARACTER_DECOMPOSE.
 * No React. No side effects.
 */

import { compose, decompose, getNextRotation } from "../../lib/character/character";
import type { CharacterAction, GameState, PoolState } from "./game";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the smallest non-negative integer not already used as a pool token id.
 * Derived purely from the pool — no stored counter needed.
 */
function nextMissingId(pool: PoolState): number {
  const usedIds = new Set(pool.map((t) => t.id));
  let id = 0;
  while (usedIds.has(id)) id++;
  return id;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Advances a single-jamo pool token to the next jamo in its rotation set.
 * No-op if the token is not found, is not single-jamo, or is not rotatable.
 *
 * @param state - Current game state
 * @param payload - tokenId to rotate
 * @returns Next game state
 */
export function handleRotateToken(
  state: GameState,
  payload: (CharacterAction & { type: "CHARACTER_ROTATE_NEXT" })["payload"],
): GameState {
  const { tokenId } = payload;
  const token = state.pool.find((t) => t.id === tokenId);
  if (token === undefined) return state;
  const newChar = getNextRotation(token.character);
  if (newChar === null) return state;
  return {
    ...state,
    pool: state.pool.map((t) => (t.id === tokenId ? { ...t, character: newChar } : t)),
  };
}

/**
 * Merges two pool tokens into one using compose(). The combined token takes
 * the id of targetId; incomingId is removed from the pool.
 * No-op if either token is not found or compose() returns null.
 *
 * @param state - Current game state
 * @param payload - targetId and incomingId to combine
 * @returns Next game state
 */
export function handleCombineTokens(
  state: GameState,
  payload: (CharacterAction & { type: "CHARACTER_COMPOSE" })["payload"],
): GameState {
  const { targetId, incomingId } = payload;
  const targetToken = state.pool.find((t) => t.id === targetId);
  const incomingToken = state.pool.find((t) => t.id === incomingId);
  if (targetToken === undefined || incomingToken === undefined) return state;
  const combined = compose(targetToken.character, incomingToken.character);
  if (combined === null) return state;
  return {
    ...state,
    pool: state.pool
      .filter((t) => t.id !== incomingId)
      .map((t) => (t.id === targetId ? { ...t, character: combined } : t)),
  };
}

/**
 * Decomposes a multi-jamo pool token back into two individual tokens.
 * The new tokens are inserted in place of the original, assigned the smallest
 * available ids. Existing token ids are preserved.
 * No-op if the token is not found or cannot be decomposed.
 *
 * @param state - Current game state
 * @param payload - tokenId to split
 * @returns Next game state
 */
export function handleSplitToken(
  state: GameState,
  payload: (CharacterAction & { type: "CHARACTER_DECOMPOSE" })["payload"],
): GameState {
  const { tokenId } = payload;
  const token = state.pool.find((t) => t.id === tokenId);
  if (token === undefined) return state;
  const parts = decompose(token.character);
  if (parts === null) return state;
  const poolWithoutToken = state.pool.filter((t) => t.id !== tokenId);
  const idA = nextMissingId(poolWithoutToken);
  const idB = nextMissingId([...poolWithoutToken, { id: idA, character: parts[0] }]);
  const newTokens = [
    { id: idA, character: parts[0] },
    { id: idB, character: parts[1] },
  ];
  return {
    ...state,
    pool: state.pool.flatMap((t) => (t.id === tokenId ? newTokens : [t])),
  };
}
