import { describe, it, expect } from "vitest";
import { gameReducer, createInitialGameState } from "./game-reducer";
import { createWord } from "../../lib/word/word";
import { character } from "../../lib/character/character";
import type { GuessRecord } from "../../lib/engine/engine";

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

  it("assigns sequential ids to pool tokens starting at 0", () => {
    const state = createInitialGameState(word("바나나"));
    expect(state.pool.map((t) => t.id)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("normalizes rotatable jamo to their canonical form", () => {
    // 나 = ㄴ+ㅏ; ㄴ is in the rotation set ["ㄱ","ㄴ"] and normalizes to ㄱ
    const state = createInitialGameState(word("나"));
    const consonantToken = state.pool.find((t) => t.character.kind === "CHOSEONG_ONLY");
    expect(
      consonantToken?.character.kind === "CHOSEONG_ONLY" && consonantToken.character.choseong,
    ).toBe("ㄱ");
  });

  it("starts with an empty guesses list", () => {
    const state = createInitialGameState(word("바나나"));
    expect(state.guesses).toHaveLength(0);
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
  it("routes CHARACTER_ROTATE_NEXT — advances the target token's jamo", () => {
    const state = createInitialGameState(word("가")); // pool: [{id:0, ㄱ}, {id:1, ㅏ}]
    const next = gameReducer(state, {
      type: "CHARACTER_ROTATE_NEXT",
      payload: { tokenId: 0 },
    });
    expect(next).not.toBe(state);
    const tok = next.pool.find((t) => t.id === 0);
    expect(tok?.character.kind === "CHOSEONG_ONLY" && tok.character.choseong).toBe("ㄴ");
  });

  it("routes CHARACTER_COMPOSE — merges two tokens into one", () => {
    const state = createInitialGameState(word("가")); // pool: [{id:0, ㄱ}, {id:1, ㅏ}]
    const next = gameReducer(state, {
      type: "CHARACTER_COMPOSE",
      payload: { targetId: 0, incomingId: 1 },
    });
    expect(next.pool).toHaveLength(1);
  });

  it("routes CHARACTER_DECOMPOSE — expands a combined token", () => {
    const combined = gameReducer(createInitialGameState(word("가")), {
      type: "CHARACTER_COMPOSE",
      payload: { targetId: 0, incomingId: 1 },
    });
    const next = gameReducer(combined, { type: "CHARACTER_DECOMPOSE", payload: { tokenId: 0 } });
    expect(next.pool).toHaveLength(2);
  });

  it("routes SUBMISSION_SLOT_INSERT — moves a token from pool into the submission slot", () => {
    const state = createInitialGameState(word("가"));
    const next = gameReducer(state, {
      type: "SUBMISSION_SLOT_INSERT",
      payload: { tokenId: 0, slotIndex: 0 },
    });
    expect(next.pool.some((t) => t.id === 0)).toBe(false);
    expect(next.submission[0]?.state).toBe("FILLED");
  });

  it("routes SUBMISSION_SLOT_REMOVE — returns a token to the pool", () => {
    const placed = gameReducer(createInitialGameState(word("가")), {
      type: "SUBMISSION_SLOT_INSERT",
      payload: { tokenId: 0, slotIndex: 0 },
    });
    const next = gameReducer(placed, { type: "SUBMISSION_SLOT_REMOVE", payload: { slotIndex: 0 } });
    expect(next.pool.some((t) => t.id === 0)).toBe(true);
    expect(next.submission[0]?.state).toBe("EMPTY");
  });

  it("routes SUBMIT_GUESS — appends the evaluation to guesses", () => {
    const state = createInitialGameState(word("가"));
    const evaluation: GuessRecord = [{ character: character("가")!, result: "CORRECT" }];
    const next = gameReducer(state, { type: "SUBMIT_GUESS", payload: { evaluation } });
    expect(next.guesses).toHaveLength(1);
  });

  it("routes RESET_ROUND — restores the pool and clears the submission", () => {
    const dirty = { ...createInitialGameState(word("가")), pool: [] };
    const next = gameReducer(dirty, { type: "RESET_ROUND" });
    expect(next.pool.length).toBeGreaterThan(0);
    expect(next.submission.every((s) => s.state === "EMPTY")).toBe(true);
  });
});
