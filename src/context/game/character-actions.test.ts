import { describe, it, expect } from "vitest";
import { handleRotateToken, handleCombineTokens, handleSplitToken } from "./character-actions";
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
// handleRotateToken
// ---------------------------------------------------------------------------

describe("handleRotateToken", () => {
  it.each([
    {
      label: "choseong",
      char: character({ choseong: "ㄱ" })!,
      target: "ㄴ",
    },
    {
      label: "jungseong",
      char: character({ jungseong: "ㅏ" })!,
      target: "ㅜ",
    },
    {
      label: "jongseong",
      char: character({ jongseong: "ㄱ" })!,
      target: "ㄴ",
    },
  ])("rotates a $label token to the target jamo", ({ char, target }) => {
    const state = makeState([token(0, char)]);
    const next = handleRotateToken(state, { tokenId: 0, targetJamo: target });
    expect(resolveCharacter(next.pool[0]!.character)).toBe(target);
  });

  it.each([
    {
      label: "unknown token id",
      pool: [token(0, character({ choseong: "ㄱ" })!)],
      payload: { tokenId: 99, targetJamo: "ㄴ" },
    },
    {
      label: "multi-jamo token",
      pool: [token(0, character("가")!)],
      payload: { tokenId: 0, targetJamo: "ㄴ" },
    },
  ])("is a no-op for $label", ({ pool, payload }) => {
    const state = makeState(pool);
    expect(handleRotateToken(state, payload)).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// handleCombineTokens
// ---------------------------------------------------------------------------

describe("handleCombineTokens", () => {
  it("reduces the pool by one after a valid combination", () => {
    const state = makeState([
      token(0, character({ choseong: "ㄱ" })!),
      token(1, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleCombineTokens(state, { tokenIdA: 0, tokenIdB: 1 });
    expect(next.pool).toHaveLength(1);
  });

  it("keeps tokenIdA and removes tokenIdB after combination", () => {
    const state = makeState([
      token(0, character({ choseong: "ㄱ" })!),
      token(1, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleCombineTokens(state, { tokenIdA: 0, tokenIdB: 1 });
    expect(next.pool[0]?.id).toBe(0);
    expect(next.pool.some((t) => t.id === 1)).toBe(false);
  });

  it("produces the correct combined character", () => {
    const state = makeState([
      token(0, character({ choseong: "ㄱ" })!),
      token(1, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleCombineTokens(state, { tokenIdA: 0, tokenIdB: 1 });
    expect(resolveCharacter(next.pool[0]!.character)).toBe("가");
  });

  it.each([
    {
      label: "unknown tokenIdA",
      pool: [token(0, character({ choseong: "ㄱ" })!), token(1, character({ jungseong: "ㅏ" })!)],
      payload: { tokenIdA: 99, tokenIdB: 1 },
    },
    {
      label: "unknown tokenIdB",
      pool: [token(0, character({ choseong: "ㄱ" })!), token(1, character({ jungseong: "ㅏ" })!)],
      payload: { tokenIdA: 0, tokenIdB: 99 },
    },
    {
      label: "incompatible pair (vowel + vowel)",
      pool: [token(0, character({ jungseong: "ㅏ" })!), token(1, character({ jungseong: "ㅏ" })!)],
      payload: { tokenIdA: 0, tokenIdB: 1 },
    },
  ])("is a no-op for $label", ({ pool, payload }) => {
    const state = makeState(pool);
    expect(handleCombineTokens(state, payload)).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// handleSplitToken
// ---------------------------------------------------------------------------

describe("handleSplitToken", () => {
  it("expands a combined token into its component jamo", () => {
    // Start with 가 (OPEN_SYLLABLE) — split should yield ㄱ + ㅏ
    const state = makeState([token(0, character("가")!)]);
    const next = handleSplitToken(state, { tokenId: 0 });
    expect(next.pool).toHaveLength(2);
    const resolved = next.pool.map((t) => resolveCharacter(t.character));
    expect(resolved).toContain("ㄱ");
    expect(resolved).toContain("ㅏ");
  });

  it("reassigns all pool ids sequentially from 0 after split", () => {
    // Pool: [combined(id 0), standalone(id 2), standalone(id 3)]
    // After splitting id 0 into 2 parts → 4 tokens, ids should be 0–3
    const state = makeState([
      token(0, character("가")!),
      token(2, character({ choseong: "ㄱ" })!),
      token(3, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleSplitToken(state, { tokenId: 0 });
    expect(next.pool.map((t) => t.id)).toEqual([0, 1, 2, 3]);
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
    expect(handleSplitToken(state, payload)).toBe(state);
  });
});
