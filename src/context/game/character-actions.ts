/**
 * @file character-actions.ts
 *
 * Handlers for character-composition actions: CHARACTER_ROTATE_NEXT, CHARACTER_COMPOSE, CHARACTER_DECOMPOSE.
 * No React. No side effects.
 */

import { compose, decompose } from "../../lib/character/composition";
import { getNextRotation } from "../../lib/character/rotation";
import type { CharacterAction, GameState, Tile } from ".";

/**
 * Advances a single-jamo pool tile to the next jamo in its rotation set.
 * No-op if the tile is not found, is not single-jamo, or is not rotatable.
 *
 * @param state - Current game state
 * @param payload - tileId to rotate
 * @returns Next game state
 */
export function handleCharacterRotateNext(
  state: GameState,
  payload: (CharacterAction & { type: "CHARACTER_ROTATE_NEXT" })["payload"],
): GameState {
  const { tileId } = payload;
  const tile = state.pool.find((t) => t.id === tileId);
  if (tile === undefined) return state;
  const newChar = getNextRotation(tile.character);
  if (newChar === null) return state;
  return {
    ...state,
    pool: state.pool.map((t) => (t.id === tileId ? { ...t, character: newChar } : t)),
  };
}

/**
 * Merges two pool tiles into one using compose(). The combined tile takes
 * the id of targetId; incomingId is removed from the pool.
 * No-op if either tile is not found or compose() returns null.
 *
 * @param state - Current game state
 * @param payload - targetId and incomingId to combine
 * @returns Next game state
 */
export function handleCharacterCompose(
  state: GameState,
  payload: (CharacterAction & { type: "CHARACTER_COMPOSE" })["payload"],
): GameState {
  const { targetId, incomingId } = payload;
  const targetTile = state.pool.find((t) => t.id === targetId);
  const incomingTile = state.pool.find((t) => t.id === incomingId);
  if (targetTile === undefined || incomingTile === undefined) return state;
  const combined = compose(targetTile.character, incomingTile.character);
  if (combined === null) return state;
  return {
    ...state,
    pool: state.pool
      .filter((t) => t.id !== incomingId)
      .map((t) => (t.id === targetId ? { ...t, character: combined } : t)),
  };
}

/**
 * Decomposes a multi-jamo pool tile back into two individual tiles.
 * The new tiles are inserted in place of the original, assigned the smallest
 * available ids. Existing tile ids are preserved.
 * No-op if the tile is not found or cannot be decomposed.
 *
 * @param state - Current game state
 * @param payload - tileId to split
 * @returns Next game state
 */
export function handleCharacterDecompose(
  state: GameState,
  payload: (CharacterAction & { type: "CHARACTER_DECOMPOSE" })["payload"],
): GameState {
  const { tileId } = payload;
  const tile = state.pool.find((t) => t.id === tileId);
  if (tile === undefined) return state;
  const parts = decompose(tile.character);
  if (parts === null) return state;
  const idB = nextMissingId(state.pool);
  return {
    ...state,
    pool: [
      ...state.pool.map((t) => (t.id === tileId ? { ...t, character: parts[0] } : t)),
      { id: idB, character: parts[1] },
    ],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the smallest non-negative integer not already used as a tile id.
 * Derived purely from the pool — no stored counter needed.
 */
function nextMissingId(pool: readonly Tile[]): number {
  const usedIds = new Set(pool.map((t) => t.id));
  let id = 0;
  while (usedIds.has(id)) id++;
  return id;
}
