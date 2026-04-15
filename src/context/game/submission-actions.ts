/**
 * @file submission-actions.ts
 *
 * Handlers for submission-slot actions: SUBMISSION_SLOT_INSERT, SUBMISSION_SLOT_REMOVE, SUBMISSION_SLOT_MOVE.
 * No React. No side effects.
 */

import type { PoolToken, GameState, SubmissionAction } from "./game";

/**
 * Moves a token from the pool into a submission slot.
 * If the slot is already filled, the existing token is returned to the pool first.
 * No-op if the token is not found or the slot index is out of bounds.
 *
 * @param state - Current game state
 * @param payload - tokenId to place and slotIndex to place it in
 * @returns Next game state
 */
export function handleSubmissionSlotInsert(
  state: GameState,
  payload: (SubmissionAction & { type: "SUBMISSION_SLOT_INSERT" })["payload"],
): GameState {
  const { tokenId, slotIndex } = payload;
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

/**
 * Moves a token from one submission slot to another without a pool round-trip.
 * If the destination slot is filled, the two tokens are swapped.
 * No-op if either index is out of bounds or the source slot is empty.
 *
 * @param state - Current game state
 * @param payload - fromSlotIndex to move from and toSlotIndex to move to
 * @returns Next game state
 */
export function handleSubmissionSlotMove(
  state: GameState,
  payload: (SubmissionAction & { type: "SUBMISSION_SLOT_MOVE" })["payload"],
): GameState {
  const { fromSlotIndex, toSlotIndex } = payload;
  const fromSlot = state.submission[fromSlotIndex];
  const toSlot = state.submission[toSlotIndex];
  if (fromSlot === undefined || toSlot === undefined || fromSlot.state !== "FILLED") {
    return state;
  }
  return {
    ...state,
    submission: state.submission.map((slot, i) => {
      if (i === toSlotIndex) return fromSlot;
      if (i === fromSlotIndex) return toSlot;
      return slot;
    }),
  };
}

/**
 * Returns the token in a submission slot back to the pool and empties the slot.
 * No-op if the slot is empty or the index is out of bounds.
 *
 * @param state - Current game state
 * @param payload - slotIndex to remove from
 * @returns Next game state
 */
export function handleSubmissionSlotRemove(
  state: GameState,
  payload: (SubmissionAction & { type: "SUBMISSION_SLOT_REMOVE" })["payload"],
): GameState {
  const { slotIndex } = payload;
  const slot = state.submission[slotIndex];
  if (slot === undefined || slot.state !== "FILLED") return state;
  return {
    ...state,
    pool: [...state.pool, { id: slot.tokenId, character: slot.character }],
    submission: state.submission.map((s, i) => (i === slotIndex ? { state: "EMPTY" as const } : s)),
  };
}
