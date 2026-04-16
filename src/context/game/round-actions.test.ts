import { describe, it, expect } from "vitest";
import { handleSubmitGuess, handleResetRound } from "./round-actions";
import { character } from "../../lib/character/character";
import { createWord } from "../../lib/word/word";
import type { GameState, SubmissionSlot } from "./game";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<GameState> = {}): GameState {
  const word = createWord("가나")!;
  return {
    targetWord: word,
    pool: [],
    submission: [{ state: "EMPTY" }, { state: "EMPTY" }],
    history: [],
    ...overrides,
  };
}

function filledSlot(syllable: string, tileId: number): SubmissionSlot {
  return { state: "FILLED", tileId, character: character(syllable)! };
}

// ---------------------------------------------------------------------------
// handleSubmitGuess
// Word is "가나" throughout — evaluations are determined by submission content.
// ---------------------------------------------------------------------------

describe("handleSubmitGuess", () => {
  it("appends the evaluation to history, preserving character and result order", () => {
    // [가, 나] against "가나" → [CORRECT, CORRECT]
    const state = makeState({
      submission: [filledSlot("가", 0), filledSlot("나", 1)],
    });
    const next = handleSubmitGuess(state);
    expect(next.history).toHaveLength(1);
    expect(next.history[0]?.[0]?.character).toEqual(character("가"));
    expect(next.history[0]?.[0]?.result).toBe("CORRECT");
    expect(next.history[0]?.[1]?.character).toEqual(character("나"));
    expect(next.history[0]?.[1]?.result).toBe("CORRECT");
  });

  it("grows history by one per call", () => {
    // CORRECT slots remain filled, so re-evaluating produces the same result
    const state = makeState({
      submission: [filledSlot("가", 0), filledSlot("나", 1)],
    });
    const after1 = handleSubmitGuess(state);
    const after2 = handleSubmitGuess(after1);
    expect(after2.history).toHaveLength(2);
  });

  it("keeps CORRECT slots filled after submission", () => {
    // [가, 다] against "가나" → [CORRECT, ABSENT]
    const state = makeState({
      submission: [filledSlot("가", 0), filledSlot("다", 1)],
    });
    const next = handleSubmitGuess(state);
    expect(next.submission[0]?.state).toBe("FILLED");
    expect(next.submission[0]).toEqual(filledSlot("가", 0));
    expect(next.submission[1]?.state).toBe("EMPTY");
  });

  it("keeps PRESENT slots filled after submission", () => {
    // [나, 가] against "가나" → [PRESENT, PRESENT]
    const state = makeState({
      submission: [filledSlot("나", 0), filledSlot("가", 1)],
    });
    const next = handleSubmitGuess(state);
    expect(next.submission[0]?.state).toBe("FILLED");
    expect(next.submission[0]).toEqual(filledSlot("나", 0));
    expect(next.pool.some((t) => t.id === 0)).toBe(false);
  });

  it("returns ABSENT tiles to the pool and empties their slots", () => {
    // [다, 나] against "가나" → [ABSENT, CORRECT]
    // 다 = OPEN_SYLLABLE(ㄷ, ㅏ) → fullDecompose → [CHOSEONG_ONLY(ㄷ), JUNGSEONG_ONLY(ㅏ)]
    const state = makeState({
      submission: [filledSlot("다", 0), filledSlot("나", 1)],
    });
    const next = handleSubmitGuess(state);
    expect(next.submission[0]?.state).toBe("EMPTY");
    expect(next.pool).toHaveLength(2);
    const absentTile = next.pool.find((t) => t.id === 0);
    expect(absentTile?.character).toEqual(character({ choseong: "ㄷ" }));
    expect(next.pool.some((t) => t.character.kind === "JUNGSEONG_ONLY")).toBe(true);
  });

  it("fully decomposes absent tiles containing composed jamo", () => {
    // [까, 나] against "가나" → [ABSENT, CORRECT]
    // 까 = OPEN_SYLLABLE(ㄲ, ㅏ) → fullDecompose → [ㄱ, ㄱ, ㅏ] (ㄲ splits into two ㄱ)
    const state = makeState({
      submission: [filledSlot("까", 0), filledSlot("나", 1)],
    });
    const next = handleSubmitGuess(state);
    expect(next.pool).toHaveLength(3);
    const tileAtId0 = next.pool.find((t) => t.id === 0);
    expect(tileAtId0?.character).toEqual(character({ choseong: "ㄱ" }));
    expect(next.pool.filter((t) => t.character.kind === "CHOSEONG_ONLY")).toHaveLength(2);
    expect(next.pool.filter((t) => t.character.kind === "JUNGSEONG_ONLY")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// handleResetRound
// ---------------------------------------------------------------------------

describe("handleResetRound", () => {
  it("restores the pool to the full word decomposition", () => {
    // 가나 fully decomposes to 4 jamo (ㄱ ㅏ ㄴ* ㅏ) — *normalized from ㄴ→ㄱ, but count is 4
    const base = makeState({ targetWord: createWord("가나")! });
    const dirty = { ...base, pool: [] };
    const next = handleResetRound(dirty);
    expect(next.pool.length).toBe(4);
  });

  it("clears all submission slots", () => {
    const state = makeState({
      submission: [filledSlot("가", 0), filledSlot("나", 1)],
    });
    const next = handleResetRound(state);
    expect(next.submission.every((s) => s.state === "EMPTY")).toBe(true);
  });

  it("does not modify history", () => {
    const state = makeState({ history: [[{ result: "ABSENT" as const }]] });
    const next = handleResetRound(state);
    expect(next.history).toHaveLength(1);
  });
});
