import { describe, it, expect } from "vitest";
import {
  handleCharacterRotateNext,
  handleCharacterCompose,
  handleCharacterDecompose,
} from "./character-actions";
import { character, resolveCharacter } from "../../lib/character/character";
import type { Character } from "../../lib/character/character";
import type { GameState, PoolState } from "./game";
import { createWord } from "../../lib/word/word";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal GameState for character-action tests — submission is irrelevant here. */
function makeState(pool: PoolState): GameState {
  return {
    word: createWord("가")!,
    pool,
    submission: [{ state: "EMPTY" }],
    guesses: [],
  };
}

function token(id: number, char: Character) {
  return { id, character: char };
}

// ---------------------------------------------------------------------------
// handleCharacterRotateNext
// ---------------------------------------------------------------------------

describe("handleCharacterRotateNext", () => {
  it.each([
    {
      label: "choseong ㄱ → ㄴ",
      char: character({ choseong: "ㄱ" })!,
      expected: "ㄴ",
    },
    {
      label: "jungseong ㅏ → ㅜ",
      char: character({ jungseong: "ㅏ" })!,
      expected: "ㅜ",
    },
    {
      label: "jongseong ㄱ → ㄴ",
      char: character({ jongseong: "ㄱ" })!,
      expected: "ㄴ",
    },
  ])("rotates a $label token to the next jamo in its rotation set", ({ char, expected }) => {
    const state = makeState([token(0, char)]);
    const next = handleCharacterRotateNext(state, { tokenId: 0 });
    expect(resolveCharacter(next.pool[0]!.character)).toBe(expected);
  });

  it.each([
    {
      label: "unknown token id",
      pool: [token(0, character({ choseong: "ㄱ" })!)],
      payload: { tokenId: 99 },
    },
    {
      label: "multi-jamo token",
      pool: [token(0, character("가")!)],
      payload: { tokenId: 0 },
    },
    {
      label: "non-rotatable single-jamo token",
      pool: [token(0, character({ choseong: "ㅁ" })!)],
      payload: { tokenId: 0 },
    },
  ])("is a no-op for $label", ({ pool, payload }) => {
    const state = makeState(pool);
    expect(handleCharacterRotateNext(state, payload)).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// handleCharacterCompose
// ---------------------------------------------------------------------------

describe("handleCharacterCompose", () => {
  it("reduces the pool by one after a valid combination", () => {
    const state = makeState([
      token(0, character({ choseong: "ㄱ" })!),
      token(1, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleCharacterCompose(state, { targetId: 0, incomingId: 1 });
    expect(next.pool).toHaveLength(1);
  });

  it("keeps targetId and removes incomingId after combination", () => {
    const state = makeState([
      token(0, character({ choseong: "ㄱ" })!),
      token(1, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleCharacterCompose(state, { targetId: 0, incomingId: 1 });
    expect(next.pool[0]?.id).toBe(0);
    expect(next.pool.some((t) => t.id === 1)).toBe(false);
  });

  it("produces the correct combined character", () => {
    const state = makeState([
      token(0, character({ choseong: "ㄱ" })!),
      token(1, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleCharacterCompose(state, { targetId: 0, incomingId: 1 });
    expect(resolveCharacter(next.pool[0]!.character)).toBe("가");
  });

  it.each([
    {
      label: "unknown targetId",
      pool: [token(0, character({ choseong: "ㄱ" })!), token(1, character({ jungseong: "ㅏ" })!)],
      payload: { targetId: 99, incomingId: 1 },
    },
    {
      label: "unknown incomingId",
      pool: [token(0, character({ choseong: "ㄱ" })!), token(1, character({ jungseong: "ㅏ" })!)],
      payload: { targetId: 0, incomingId: 99 },
    },
    {
      label: "incompatible pair (vowel + vowel)",
      pool: [token(0, character({ jungseong: "ㅏ" })!), token(1, character({ jungseong: "ㅏ" })!)],
      payload: { targetId: 0, incomingId: 1 },
    },
  ])("is a no-op for $label", ({ pool, payload }) => {
    const state = makeState(pool);
    expect(handleCharacterCompose(state, payload)).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// handleCharacterDecompose
// ---------------------------------------------------------------------------

describe("handleCharacterDecompose", () => {
  it("expands a combined token into its component jamo", () => {
    // Start with 가 (OPEN_SYLLABLE) — split should yield ㄱ + ㅏ
    const state = makeState([token(0, character("가")!)]);
    const next = handleCharacterDecompose(state, { tokenId: 0 });
    expect(next.pool).toHaveLength(2);
    const resolved = next.pool.map((t) => resolveCharacter(t.character));
    expect(resolved).toContain("ㄱ");
    expect(resolved).toContain("ㅏ");
  });

  it("keeps the original token id for the first part and appends the second part with the next-available id", () => {
    // Pool: [combined(id 0), standalone(id 2), standalone(id 3)]
    // Splitting id 0: original keeps id 0 (parts[0]), new token gets id 1 (next available), appended at end
    const state = makeState([
      token(0, character("가")!),
      token(2, character({ choseong: "ㄱ" })!),
      token(3, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleCharacterDecompose(state, { tokenId: 0 });
    expect(next.pool.map((t) => t.id)).toEqual([0, 2, 3, 1]);
  });

  it("updates the original token in place and appends the extra token to the end", () => {
    // Pool: [standalone(id 0), combined(id 1), standalone(id 2)]
    // Splitting id 1: original keeps id 1 (parts[0]), new token gets id 3 (next available), appended at end
    const state = makeState([
      token(0, character({ choseong: "ㄴ" })!),
      token(1, character("가")!),
      token(2, character({ jungseong: "ㅡ" })!),
    ]);
    const next = handleCharacterDecompose(state, { tokenId: 1 });
    expect(next.pool).toHaveLength(4);
    expect(next.pool[0]!.id).toBe(0);
    expect(next.pool[1]!.id).toBe(1);
    expect(next.pool[2]!.id).toBe(2);
    expect(next.pool[3]!.id).toBe(3);
  });

  it.each([
    {
      label: "single-jamo token",
      pool: [token(0, character({ choseong: "ㄱ" })!)],
      payload: { tokenId: 0 },
    },
    {
      label: "unknown token id",
      pool: [token(0, character({ choseong: "ㄱ" })!)],
      payload: { tokenId: 99 },
    },
  ])("is a no-op for $label", ({ pool, payload }) => {
    const state = makeState(pool);
    expect(handleCharacterDecompose(state, payload)).toBe(state);
  });
});
