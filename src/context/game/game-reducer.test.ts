import { describe, it, expect } from "vitest";
import { gameReducer, createInitialGameState } from "./game-reducer";
import { createWord } from "../../lib/word/word";
import { character } from "../../lib/character/character";

function word(str: string) {
  return createWord(str)!;
}

// ---------------------------------------------------------------------------
// createInitialGameState
// ---------------------------------------------------------------------------

describe("createInitialGameState", () => {
  it("produces submission length equal to word length", () => {
    const state = createInitialGameState(word("바나나"));
    expect(state.submission.length).toBe(3);
  });

  it("produces all-empty submission slots", () => {
    const state = createInitialGameState(word("바나나"));
    expect(state.submission.every((s) => s.state === "EMPTY")).toBe(true);
  });

  it("fully decomposes the word into the pool", () => {
    // 바 = ㅂ+ㅏ, 밥 = ㅂ+ㅏ+ㅂ → 5 jamo
    const state = createInitialGameState(word("바밥"));
    expect(state.pool.length).toBe(5);
  });

  it("assigns sequential ids to pool tiles starting at 0", () => {
    const state = createInitialGameState(word("바나나"));
    expect(state.pool.map((t) => t.id)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("normalizes rotatable jamo to their canonical form", () => {
    // 나 = ㄴ+ㅏ; ㄴ is in the rotation set ["ㄱ","ㄴ"] and normalizes to ㄱ
    const state = createInitialGameState(word("나"));
    const consonantTile = state.pool.find((t) => t.character.kind === "CHOSEONG_ONLY");
    expect(
      consonantTile?.character.kind === "CHOSEONG_ONLY" && consonantTile.character.choseong,
    ).toBe("ㄱ");
  });

  it("starts with an empty history", () => {
    const state = createInitialGameState(word("바나나"));
    expect(state.history).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// gameReducer — routing smoke tests
//
// Detailed behaviour for each action is covered in the colocated action test
// files. These tests verify only that the reducer correctly delegates each
// action type and returns a changed state.
// ---------------------------------------------------------------------------

describe("gameReducer", () => {
  it("routes CHARACTER_ROTATE_NEXT — advances the target tile's jamo", () => {
    const state = createInitialGameState(word("가")); // pool: [{id:0, ㄱ}, {id:1, ㅏ}]
    const next = gameReducer(state, {
      type: "CHARACTER_ROTATE_NEXT",
      payload: { tileId: 0 },
    });
    expect(next).not.toBe(state);
    const tok = next.pool.find((t) => t.id === 0);
    expect(tok?.character.kind === "CHOSEONG_ONLY" && tok.character.choseong).toBe("ㄴ");
  });

  it("routes CHARACTER_COMPOSE — merges two tiles into one", () => {
    const state = createInitialGameState(word("가")); // pool: [{id:0, ㄱ}, {id:1, ㅏ}]
    const next = gameReducer(state, {
      type: "CHARACTER_COMPOSE",
      payload: { targetId: 0, incomingId: 1 },
    });
    expect(next.pool).toHaveLength(1);
  });

  it("routes CHARACTER_DECOMPOSE — expands a combined tile", () => {
    const combined = gameReducer(createInitialGameState(word("가")), {
      type: "CHARACTER_COMPOSE",
      payload: { targetId: 0, incomingId: 1 },
    });
    const next = gameReducer(combined, { type: "CHARACTER_DECOMPOSE", payload: { tileId: 0 } });
    expect(next.pool).toHaveLength(2);
  });

  it("routes SUBMISSION_SLOT_INSERT — moves a tile from pool into the submission slot", () => {
    const state = createInitialGameState(word("가"));
    const next = gameReducer(state, {
      type: "SUBMISSION_SLOT_INSERT",
      payload: { tileId: 0, slotIndex: 0 },
    });
    expect(next.pool.some((t) => t.id === 0)).toBe(false);
    expect(next.submission[0]?.state).toBe("FILLED");
  });

  it("routes SUBMISSION_SLOT_MOVE — swaps tiles between slots", () => {
    const state = createInitialGameState(word("가나"));
    const placed = gameReducer(state, {
      type: "SUBMISSION_SLOT_INSERT",
      payload: { tileId: 0, slotIndex: 0 },
    });
    const next = gameReducer(placed, {
      type: "SUBMISSION_SLOT_MOVE",
      payload: { fromSlotIndex: 0, toSlotIndex: 1 },
    });
    expect(next.submission[0]?.state).toBe("EMPTY");
    expect(next.submission[1]?.state).toBe("FILLED");
  });

  it("routes SUBMISSION_SLOT_REMOVE — returns a tile to the pool", () => {
    const placed = gameReducer(createInitialGameState(word("가")), {
      type: "SUBMISSION_SLOT_INSERT",
      payload: { tileId: 0, slotIndex: 0 },
    });
    const next = gameReducer(placed, { type: "SUBMISSION_SLOT_REMOVE", payload: { slotIndex: 0 } });
    expect(next.pool.some((t) => t.id === 0)).toBe(true);
    expect(next.submission[0]?.state).toBe("EMPTY");
  });

  it("routes ROUND_SUBMISSION_SUBMIT — appends the evaluation to history", () => {
    const initial = createInitialGameState(word("가"));
    // Manually place "가" in slot 0 so evaluateGuess has a filled submission to work with
    const state = {
      ...initial,
      pool: [],
      submission: [{ state: "FILLED" as const, tileId: 0, character: character("가")! }],
    };
    const next = gameReducer(state, { type: "ROUND_SUBMISSION_SUBMIT" });
    expect(next.history).toHaveLength(1);
  });

  it("routes ROUND_RESET — restores the pool and clears the submission", () => {
    const dirty = { ...createInitialGameState(word("가")), pool: [] };
    const next = gameReducer(dirty, { type: "ROUND_RESET" });
    expect(next.pool.length).toBeGreaterThan(0);
    expect(next.submission.every((s) => s.state === "EMPTY")).toBe(true);
  });
});
