import { describe, it, expect } from "vitest";
import {
  handleSubmissionSlotInsert,
  handleSubmissionSlotMove,
  handleSubmissionSlotRemove,
} from "./submission-actions";
import { character } from "../../lib/character";
import { createWord } from "../../lib/word";
import type { GameState } from "./game";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Two-slot GameState matching a two-character word. */
function twoSlotState(): GameState {
  const word = createWord("가나")!;
  return {
    targetWord: word,
    pool: [
      { id: 0, character: character("가")! },
      { id: 1, character: character("나")! },
    ],
    submission: [{ state: "EMPTY" }, { state: "EMPTY" }],
    history: [],
  };
}

// ---------------------------------------------------------------------------
// handleSubmissionSlotInsert
// ---------------------------------------------------------------------------

describe("handleSubmissionSlotInsert", () => {
  it("removes the tile from the pool and fills the target slot", () => {
    const state = twoSlotState();
    const next = handleSubmissionSlotInsert(state, { tileId: 0, slotIndex: 0 });
    expect(next.pool.some((t) => t.id === 0)).toBe(false);
    const slot = next.submission[0];
    expect(slot?.state).toBe("FILLED");
    expect(slot?.state === "FILLED" && slot.tileId).toBe(0);
  });

  it("returns the displaced tile to the pool when replacing a filled slot", () => {
    const state = twoSlotState();
    const after1 = handleSubmissionSlotInsert(state, { tileId: 0, slotIndex: 0 });
    const after2 = handleSubmissionSlotInsert(after1, { tileId: 1, slotIndex: 0 });
    // Tile 0 should be back in pool; slot 0 should hold tile 1
    expect(after2.pool.some((t) => t.id === 0)).toBe(true);
    const slot = after2.submission[0];
    expect(slot?.state === "FILLED" && slot.tileId).toBe(1);
  });

  it.each([
    {
      label: "unknown tile id",
      payload: { tileId: 99, slotIndex: 0 },
    },
    {
      label: "out-of-bounds slot index",
      payload: { tileId: 0, slotIndex: 5 },
    },
  ])("is a no-op for $label", ({ payload }) => {
    const state = twoSlotState();
    expect(handleSubmissionSlotInsert(state, payload)).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// handleSubmissionSlotRemove
// ---------------------------------------------------------------------------

describe("handleSubmissionSlotRemove", () => {
  it("returns the tile to the pool and empties the slot", () => {
    const state = twoSlotState();
    const placed = handleSubmissionSlotInsert(state, { tileId: 0, slotIndex: 0 });
    const removed = handleSubmissionSlotRemove(placed, { slotIndex: 0 });
    expect(removed.pool.some((t) => t.id === 0)).toBe(true);
    expect(removed.submission[0]?.state).toBe("EMPTY");
  });

  it.each([
    {
      label: "empty slot",
      slotIndex: 0,
    },
    {
      label: "out-of-bounds slot index",
      slotIndex: 99,
    },
  ])("is a no-op for $label", ({ slotIndex }) => {
    const state = twoSlotState();
    expect(handleSubmissionSlotRemove(state, { slotIndex })).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// handleSubmissionSlotMove
// ---------------------------------------------------------------------------

describe("handleSubmissionSlotMove", () => {
  it("moves a tile from one slot to an empty slot", () => {
    const state = twoSlotState();
    const placed = handleSubmissionSlotInsert(state, { tileId: 0, slotIndex: 0 });
    const moved = handleSubmissionSlotMove(placed, { fromSlotIndex: 0, toSlotIndex: 1 });
    expect(moved.submission[0]?.state).toBe("EMPTY");
    const toSlot = moved.submission[1];
    expect(toSlot?.state === "FILLED" && toSlot.tileId).toBe(0);
  });

  it("swaps tiles when the destination slot is filled", () => {
    const state = twoSlotState();
    const placed = handleSubmissionSlotInsert(state, { tileId: 0, slotIndex: 0 });
    const placed2 = handleSubmissionSlotInsert(placed, { tileId: 1, slotIndex: 1 });
    const moved = handleSubmissionSlotMove(placed2, { fromSlotIndex: 0, toSlotIndex: 1 });
    const slot0 = moved.submission[0];
    const slot1 = moved.submission[1];
    expect(slot0?.state === "FILLED" && slot0.tileId).toBe(1);
    expect(slot1?.state === "FILLED" && slot1.tileId).toBe(0);
  });

  it("does not touch the pool", () => {
    const state = twoSlotState();
    const placed = handleSubmissionSlotInsert(state, { tileId: 0, slotIndex: 0 });
    const moved = handleSubmissionSlotMove(placed, { fromSlotIndex: 0, toSlotIndex: 1 });
    expect(moved.pool).toEqual(placed.pool);
  });

  it.each([
    { label: "empty source slot", fromSlotIndex: 1, toSlotIndex: 0 },
    { label: "out-of-bounds source", fromSlotIndex: 99, toSlotIndex: 0 },
    { label: "out-of-bounds destination", fromSlotIndex: 0, toSlotIndex: 99 },
  ])("is a no-op for $label", ({ fromSlotIndex, toSlotIndex }) => {
    const state = twoSlotState();
    const placed = handleSubmissionSlotInsert(state, { tileId: 0, slotIndex: 0 });
    expect(handleSubmissionSlotMove(placed, { fromSlotIndex, toSlotIndex })).toBe(placed);
  });
});
