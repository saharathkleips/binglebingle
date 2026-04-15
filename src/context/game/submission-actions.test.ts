import { describe, it, expect } from "vitest";
import { handleSubmissionSlotInsert, handleSubmissionSlotRemove } from "./submission-actions";
import { character } from "../../lib/character/character";
import { createWord } from "../../lib/word/word";
import type { GameState } from "./game";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Two-slot GameState matching a two-character word. */
function twoSlotState(): GameState {
  const word = createWord("가나")!;
  return {
    word,
    pool: [
      { id: 0, character: character("가")! },
      { id: 1, character: character("나")! },
    ],
    submission: [{ state: "EMPTY" }, { state: "EMPTY" }],
    guesses: [],
  };
}

// ---------------------------------------------------------------------------
// handleSubmissionSlotInsert
// ---------------------------------------------------------------------------

describe("handleSubmissionSlotInsert", () => {
  it("removes the token from the pool and fills the target slot", () => {
    const state = twoSlotState();
    const next = handleSubmissionSlotInsert(state, { tokenId: 0, slotIndex: 0 });
    expect(next.pool.some((t) => t.id === 0)).toBe(false);
    const slot = next.submission[0];
    expect(slot?.state).toBe("FILLED");
    expect(slot?.state === "FILLED" && slot.tokenId).toBe(0);
  });

  it("returns the displaced token to the pool when replacing a filled slot", () => {
    const state = twoSlotState();
    const after1 = handleSubmissionSlotInsert(state, { tokenId: 0, slotIndex: 0 });
    const after2 = handleSubmissionSlotInsert(after1, { tokenId: 1, slotIndex: 0 });
    // Token 0 should be back in pool; slot 0 should hold token 1
    expect(after2.pool.some((t) => t.id === 0)).toBe(true);
    const slot = after2.submission[0];
    expect(slot?.state === "FILLED" && slot.tokenId).toBe(1);
  });

  it.each([
    {
      label: "unknown token id",
      payload: { tokenId: 99, slotIndex: 0 },
    },
    {
      label: "out-of-bounds slot index",
      payload: { tokenId: 0, slotIndex: 5 },
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
  it("returns the token to the pool and empties the slot", () => {
    const state = twoSlotState();
    const placed = handleSubmissionSlotInsert(state, { tokenId: 0, slotIndex: 0 });
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
