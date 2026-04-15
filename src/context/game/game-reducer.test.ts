import { describe, it, expect } from "vitest";
import { gameReducer, createInitialGameState } from "./game-reducer";
import { createWord } from "../../lib/word/word";
import { character, resolveCharacter } from "../../lib/character/character";
import type { GameState, GameAction, SubmissionSlot } from "./game";
import type { GuessRecord } from "../../lib/engine/engine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function word(str: string) {
  return createWord(str)!;
}

function dispatch(state: GameState, action: GameAction): GameState {
  return gameReducer(state, action);
}

function filledSlot(syllable: string, tokenId: number): SubmissionSlot {
  return { state: "FILLED", tokenId, character: character(syllable)! };
}

function correctEval(syllable: string): GuessRecord[number] {
  return { character: character(syllable)!, result: "CORRECT" };
}

function absentEval(syllable: string): GuessRecord[number] {
  return { character: character(syllable)!, result: "ABSENT" };
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
    const ids = state.pool.map((t) => t.id);
    expect(ids).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("normalizes rotatable jamo to their canonical form", () => {
    // 나 = ㄴ+ㅏ; ㄴ is in the rotation set ["ㄱ","ㄴ"] and normalizes to ㄱ
    const state = createInitialGameState(word("나"));
    const consonantToken = state.pool.find((t) => t.character.kind === "CHOSEONG_ONLY");
    expect(consonantToken).toBeDefined();
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
// ROTATE_TOKEN
// ---------------------------------------------------------------------------

describe("gameReducer ROTATE_TOKEN", () => {
  it("rotates a single consonant pool token to the target jamo", () => {
    // Pool for 가: [{id:0, ㄱ}, {id:1, ㅏ}]
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, {
      type: "ROTATE_TOKEN",
      payload: { tokenId: 0, targetJamo: "ㄴ" },
    });
    const token = nextState.pool.find((t) => t.id === 0);
    expect(token?.character.kind === "CHOSEONG_ONLY" && token.character.choseong).toBe("ㄴ");
  });

  it("rotates a single vowel pool token to the target jamo", () => {
    // Pool for 가: [{id:0, ㄱ}, {id:1, ㅏ}]
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, {
      type: "ROTATE_TOKEN",
      payload: { tokenId: 1, targetJamo: "ㅜ" },
    });
    const token = nextState.pool.find((t) => t.id === 1);
    expect(token?.character.kind === "JUNGSEONG_ONLY" && token.character.jungseong).toBe("ㅜ");
  });

  it("is a no-op for an unknown token id", () => {
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, {
      type: "ROTATE_TOKEN",
      payload: { tokenId: 99, targetJamo: "ㄴ" },
    });
    expect(nextState).toBe(state);
  });

  it("is a no-op for a multi-jamo token (e.g. combined syllable)", () => {
    // Manually build a state with a combined token
    const base = createInitialGameState(word("가"));
    // Combine ㄱ (id 0) and ㅏ (id 1) → OPEN_SYLLABLE
    const combined = dispatch(base, {
      type: "COMBINE_TOKENS",
      payload: { tokenIdA: 0, tokenIdB: 1 },
    });
    const combinedToken = combined.pool.find((t) => t.id === 0)!;
    expect(combinedToken.character.kind).toBe("OPEN_SYLLABLE");

    const nextState = dispatch(combined, {
      type: "ROTATE_TOKEN",
      payload: { tokenId: 0, targetJamo: "ㄴ" },
    });
    expect(nextState).toBe(combined);
  });
});

// ---------------------------------------------------------------------------
// COMBINE_TOKENS
// ---------------------------------------------------------------------------

describe("gameReducer COMBINE_TOKENS", () => {
  it("combines two single-jamo pool tokens into one", () => {
    // 가 pool: [{id:0, ㄱ}, {id:1, ㅏ}]
    const state = createInitialGameState(word("가"));
    expect(state.pool.length).toBe(2);
    const nextState = dispatch(state, {
      type: "COMBINE_TOKENS",
      payload: { tokenIdA: 0, tokenIdB: 1 },
    });
    expect(nextState.pool.length).toBe(1);
    const token = nextState.pool[0]!;
    expect(resolveCharacter(token.character)).toBe("가");
  });

  it("preserves token id of tokenA after combination", () => {
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, {
      type: "COMBINE_TOKENS",
      payload: { tokenIdA: 0, tokenIdB: 1 },
    });
    expect(nextState.pool[0]?.id).toBe(0);
  });

  it("is a no-op when combine result is null", () => {
    // Two vowels cannot combine (e.g. ㅏ+ㅎ — ㅎ decomposed from 흐=ㅎ+ㅡ, but let's use 바바)
    // 바바 pool: [{id:0, ㅂ}, {id:1, ㅏ}, {id:2, ㅂ}, {id:3, ㅏ}]
    // Trying to combine two ㅂ tokens would call compose(CHOSEONG_ONLY(ㅂ), CHOSEONG_ONLY(ㅂ))
    // composeJamo("ㅂ","ㅂ") → ㅃ exists — actually this would work!
    // Use two vowels instead: compose(JUNGSEONG_ONLY(ㅏ), CHOSEONG_ONLY(ㅂ)) = character({choseong:ㅂ, jungseong:ㅏ}) = 바 — that works too
    // Use something that truly fails: compose(JUNGSEONG_ONLY(ㅏ), JUNGSEONG_ONLY(ㅏ))
    // composeJamo("ㅏ","ㅏ") → no rule → null
    const state = createInitialGameState(word("아아")); // 아=ㅇ+ㅏ, two 아's
    // pool: [{id:0, ㅇ}, {id:1, ㅏ}, {id:2, ㅇ}, {id:3, ㅏ}]
    // Trying to combine id:1 (ㅏ) and id:3 (ㅏ): no rule exists
    const nextState = dispatch(state, {
      type: "COMBINE_TOKENS",
      payload: { tokenIdA: 1, tokenIdB: 3 },
    });
    expect(nextState).toBe(state);
  });

  it("is a no-op for unknown token ids", () => {
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, {
      type: "COMBINE_TOKENS",
      payload: { tokenIdA: 0, tokenIdB: 99 },
    });
    expect(nextState).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// SPLIT_TOKEN
// ---------------------------------------------------------------------------

describe("gameReducer SPLIT_TOKEN", () => {
  it("splits a combined token back into its component tokens", () => {
    const state = createInitialGameState(word("가"));
    const combined = dispatch(state, {
      type: "COMBINE_TOKENS",
      payload: { tokenIdA: 0, tokenIdB: 1 },
    });
    expect(combined.pool.length).toBe(1);

    const split = dispatch(combined, { type: "SPLIT_TOKEN", payload: { tokenId: 0 } });
    expect(split.pool.length).toBe(2);
  });

  it("reassigns all pool ids from scratch after split", () => {
    // 가나 pool: [{0,ㄱ},{1,ㅏ},{2,ㄱ*},{3,ㅏ}] (* ㄴ normalized to ㄱ)
    // Combine tokens 0+1 → pool: [{0, 가_char}, {2,ㄱ}, {3,ㅏ}] — wait, id 2 and 3 remain
    // Then split token 0 → pool has 4 tokens, ids reassigned to 0,1,2,3
    const state = createInitialGameState(word("가나"));
    const combined = dispatch(state, {
      type: "COMBINE_TOKENS",
      payload: { tokenIdA: 0, tokenIdB: 1 },
    });
    const split = dispatch(combined, { type: "SPLIT_TOKEN", payload: { tokenId: 0 } });
    const ids = split.pool.map((t) => t.id).sort((a, b) => a - b);
    expect(ids).toEqual([0, 1, 2, 3]);
  });

  it("is a no-op for a single-jamo token", () => {
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, { type: "SPLIT_TOKEN", payload: { tokenId: 0 } });
    expect(nextState).toBe(state);
  });

  it("is a no-op for an unknown token id", () => {
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, { type: "SPLIT_TOKEN", payload: { tokenId: 99 } });
    expect(nextState).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// PLACE_TOKEN
// ---------------------------------------------------------------------------

describe("gameReducer PLACE_TOKEN", () => {
  it("removes the token from pool and fills the slot", () => {
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, {
      type: "PLACE_TOKEN",
      payload: { tokenId: 0, slotIndex: 0 },
    });
    expect(nextState.pool.some((t) => t.id === 0)).toBe(false);
    const slot = nextState.submission[0];
    expect(slot?.state).toBe("FILLED");
    expect(slot?.state === "FILLED" && slot.tokenId).toBe(0);
  });

  it("returns the previous token to pool when replacing a filled slot", () => {
    const state = createInitialGameState(word("가"));
    // Place token 0 into slot 0
    const after1 = dispatch(state, {
      type: "PLACE_TOKEN",
      payload: { tokenId: 0, slotIndex: 0 },
    });
    // Place token 1 into slot 0 — token 0 should return to pool
    const after2 = dispatch(after1, {
      type: "PLACE_TOKEN",
      payload: { tokenId: 1, slotIndex: 0 },
    });
    expect(after2.pool.some((t) => t.id === 0)).toBe(true);
    const slot = after2.submission[0];
    expect(slot?.state === "FILLED" && slot.tokenId).toBe(1);
  });

  it("is a no-op for an unknown token id", () => {
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, {
      type: "PLACE_TOKEN",
      payload: { tokenId: 99, slotIndex: 0 },
    });
    expect(nextState).toBe(state);
  });

  it("is a no-op for an out-of-bounds slot index", () => {
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, {
      type: "PLACE_TOKEN",
      payload: { tokenId: 0, slotIndex: 5 },
    });
    expect(nextState).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// REMOVE_FROM_SLOT
// ---------------------------------------------------------------------------

describe("gameReducer REMOVE_FROM_SLOT", () => {
  it("returns the token to the pool and empties the slot", () => {
    const state = createInitialGameState(word("가"));
    const placed = dispatch(state, {
      type: "PLACE_TOKEN",
      payload: { tokenId: 0, slotIndex: 0 },
    });
    const removed = dispatch(placed, { type: "REMOVE_FROM_SLOT", payload: { slotIndex: 0 } });

    expect(removed.pool.some((t) => t.id === 0)).toBe(true);
    expect(removed.submission[0]?.state).toBe("EMPTY");
  });

  it("is a no-op for an empty slot", () => {
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, { type: "REMOVE_FROM_SLOT", payload: { slotIndex: 0 } });
    expect(nextState).toBe(state);
  });

  it("is a no-op for an out-of-bounds slot index", () => {
    const state = createInitialGameState(word("가"));
    const nextState = dispatch(state, { type: "REMOVE_FROM_SLOT", payload: { slotIndex: 99 } });
    expect(nextState).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// SUBMIT_GUESS
// ---------------------------------------------------------------------------

describe("gameReducer SUBMIT_GUESS", () => {
  it("appends the evaluation to guesses", () => {
    const base = createInitialGameState(word("가"));
    const evaluation: GuessRecord = [correctEval("가")];
    const nextState = dispatch(base, { type: "SUBMIT_GUESS", payload: { evaluation } });
    expect(nextState.guesses).toHaveLength(1);
    expect(nextState.guesses[0]).toBe(evaluation);
  });

  it("keeps correct slots filled after submission", () => {
    // Build a state with slot 0 filled
    const base = createInitialGameState(word("가나"));
    const withSlot: GameState = {
      ...base,
      pool: base.pool.filter((t) => t.id !== 0),
      submission: [filledSlot("가", 0), { state: "EMPTY" }],
    };
    const evaluation: GuessRecord = [correctEval("가"), absentEval("나")];
    const nextState = dispatch(withSlot, { type: "SUBMIT_GUESS", payload: { evaluation } });
    expect(nextState.submission[0]?.state).toBe("FILLED");
  });

  it("returns present/absent tokens to the pool", () => {
    const base = createInitialGameState(word("가나"));
    const withSlot: GameState = {
      ...base,
      pool: base.pool.filter((t) => t.id !== 0),
      submission: [filledSlot("가", 0), { state: "EMPTY" }],
    };
    const evaluation: GuessRecord = [absentEval("가"), absentEval("나")];
    const nextState = dispatch(withSlot, { type: "SUBMIT_GUESS", payload: { evaluation } });
    expect(nextState.pool.some((t) => t.id === 0)).toBe(true);
    expect(nextState.submission[0]?.state).toBe("EMPTY");
  });

  it("grows guesses by one per submission", () => {
    let state = createInitialGameState(word("가"));
    const evaluation: GuessRecord = [absentEval("나")];
    state = dispatch(state, { type: "SUBMIT_GUESS", payload: { evaluation } });
    state = dispatch(state, { type: "SUBMIT_GUESS", payload: { evaluation } });
    expect(state.guesses).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// RESET_ROUND
// ---------------------------------------------------------------------------

describe("gameReducer RESET_ROUND", () => {
  it("restores the pool from the word", () => {
    const state = createInitialGameState(word("가"));
    // Remove token from pool to dirty the state
    const dirty: GameState = { ...state, pool: [] };
    const reset = dispatch(dirty, { type: "RESET_ROUND" });
    expect(reset.pool.length).toBe(state.pool.length);
  });

  it("clears all submission slots", () => {
    const state = createInitialGameState(word("가나"));
    const withFilled: GameState = {
      ...state,
      submission: [filledSlot("가", 0), filledSlot("나", 1)],
    };
    const reset = dispatch(withFilled, { type: "RESET_ROUND" });
    expect(reset.submission.every((s) => s.state === "EMPTY")).toBe(true);
  });

  it("does not append to guesses", () => {
    const state = createInitialGameState(word("가"));
    const reset = dispatch(state, { type: "RESET_ROUND" });
    expect(reset.guesses).toHaveLength(0);
  });
});
