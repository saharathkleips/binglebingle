import { describe, it, expect } from "vitest";
import { handleSubmitGuess, handleResetRound } from "./round-actions";
import { character } from "../../lib/character/character";
import { createWord } from "../../lib/word/word";
import type { GameState, SubmissionSlot } from "./game";
import type { GuessRecord } from "../../lib/engine/engine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<GameState> = {}): GameState {
  const word = createWord("가나")!;
  return {
    word,
    pool: [],
    submission: [{ state: "EMPTY" }, { state: "EMPTY" }],
    guesses: [],
    ...overrides,
  };
}

function filledSlot(syllable: string, tokenId: number): SubmissionSlot {
  return { state: "FILLED", tokenId, character: character(syllable)! };
}

function evalEntry(
  syllable: string,
  result: "CORRECT" | "PRESENT" | "ABSENT",
): GuessRecord[number] {
  return { character: character(syllable)!, result };
}

// ---------------------------------------------------------------------------
// handleSubmitGuess
// ---------------------------------------------------------------------------

describe("handleSubmitGuess", () => {
  it("appends the evaluation to guesses", () => {
    const evaluation: GuessRecord = [evalEntry("가", "CORRECT"), evalEntry("나", "ABSENT")];
    const next = handleSubmitGuess(makeState(), { evaluation });
    expect(next.guesses).toHaveLength(1);
    expect(next.guesses[0]).toBe(evaluation);
  });

  it("grows guesses by one per call", () => {
    const evaluation: GuessRecord = [evalEntry("가", "ABSENT"), evalEntry("나", "ABSENT")];
    const after1 = handleSubmitGuess(makeState(), { evaluation });
    const after2 = handleSubmitGuess(after1, { evaluation });
    expect(after2.guesses).toHaveLength(2);
  });

  it("keeps CORRECT slots filled after submission", () => {
    const state = makeState({
      pool: [],
      submission: [filledSlot("가", 0), { state: "EMPTY" }],
    });
    const evaluation: GuessRecord = [evalEntry("가", "CORRECT"), evalEntry("나", "ABSENT")];
    const next = handleSubmitGuess(state, { evaluation });
    expect(next.submission[0]?.state).toBe("FILLED");
  });

  it.each([
    { label: "ABSENT", result: "ABSENT" as const },
    { label: "PRESENT", result: "PRESENT" as const },
  ])("returns $label tokens to the pool and empties their slots", ({ result }) => {
    const state = makeState({
      pool: [],
      submission: [filledSlot("가", 0), { state: "EMPTY" }],
    });
    const evaluation: GuessRecord = [evalEntry("가", result), evalEntry("나", "ABSENT")];
    const next = handleSubmitGuess(state, { evaluation });
    expect(next.pool.some((t) => t.id === 0)).toBe(true);
    expect(next.submission[0]?.state).toBe("EMPTY");
  });
});

// ---------------------------------------------------------------------------
// handleResetRound
// ---------------------------------------------------------------------------

describe("handleResetRound", () => {
  it("restores the pool to the full word decomposition", () => {
    // 가나 fully decomposes to 4 jamo (ㄱ ㅏ ㄴ* ㅏ) — *normalized from ㄴ→ㄱ, but count is 4
    const base = makeState({ word: createWord("가나")! });
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

  it("does not modify guesses", () => {
    const evaluation: GuessRecord = [evalEntry("가", "ABSENT"), evalEntry("나", "ABSENT")];
    const state = makeState({ guesses: [evaluation] });
    const next = handleResetRound(state);
    expect(next.guesses).toHaveLength(1);
  });
});
