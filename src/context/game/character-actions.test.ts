import { describe, it, expect } from "vitest";
import {
  handleCharacterRotateNext,
  handleCharacterCompose,
  handleCharacterDecompose,
} from "./character-actions";
import { character, resolveCharacter } from "../../lib/character";
import type { Character } from "../../lib/character";
import type { GameState, Tile } from "./index";
import { createWord } from "../../lib/word";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal GameState for character-action tests — submission is irrelevant here. */
function makeState(pool: readonly Tile[]): GameState {
  return {
    targetWord: createWord("가")!,
    pool,
    submission: [{ state: "EMPTY" }],
    history: [],
  };
}

function tile(id: number, char: Character) {
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
  ])("rotates a $label tile to the next jamo in its rotation set", ({ char, expected }) => {
    const state = makeState([tile(0, char)]);
    const next = handleCharacterRotateNext(state, { tileId: 0 });
    expect(resolveCharacter(next.pool[0]!.character)).toBe(expected);
  });

  it.each([
    {
      label: "unknown tile id",
      pool: [tile(0, character({ choseong: "ㄱ" })!)],
      payload: { tileId: 99 },
    },
    {
      label: "multi-jamo tile",
      pool: [tile(0, character("가")!)],
      payload: { tileId: 0 },
    },
    {
      label: "non-rotatable single-jamo tile",
      pool: [tile(0, character({ choseong: "ㅁ" })!)],
      payload: { tileId: 0 },
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
      tile(0, character({ choseong: "ㄱ" })!),
      tile(1, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleCharacterCompose(state, { targetId: 0, incomingId: 1 });
    expect(next.pool).toHaveLength(1);
  });

  it("keeps targetId and removes incomingId after combination", () => {
    const state = makeState([
      tile(0, character({ choseong: "ㄱ" })!),
      tile(1, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleCharacterCompose(state, { targetId: 0, incomingId: 1 });
    expect(next.pool[0]?.id).toBe(0);
    expect(next.pool.some((t) => t.id === 1)).toBe(false);
  });

  it("produces the correct combined character", () => {
    const state = makeState([
      tile(0, character({ choseong: "ㄱ" })!),
      tile(1, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleCharacterCompose(state, { targetId: 0, incomingId: 1 });
    expect(resolveCharacter(next.pool[0]!.character)).toBe("가");
  });

  it.each([
    {
      label: "unknown targetId",
      pool: [tile(0, character({ choseong: "ㄱ" })!), tile(1, character({ jungseong: "ㅏ" })!)],
      payload: { targetId: 99, incomingId: 1 },
    },
    {
      label: "unknown incomingId",
      pool: [tile(0, character({ choseong: "ㄱ" })!), tile(1, character({ jungseong: "ㅏ" })!)],
      payload: { targetId: 0, incomingId: 99 },
    },
    {
      label: "incompatible pair (vowel + vowel)",
      pool: [tile(0, character({ jungseong: "ㅏ" })!), tile(1, character({ jungseong: "ㅏ" })!)],
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
  it("expands a combined tile into its component jamo", () => {
    // Start with 가 (OPEN_SYLLABLE) — split should yield ㄱ + ㅏ
    const state = makeState([tile(0, character("가")!)]);
    const next = handleCharacterDecompose(state, { tileId: 0 });
    expect(next.pool).toHaveLength(2);
    const resolved = next.pool.map((t) => resolveCharacter(t.character));
    expect(resolved).toContain("ㄱ");
    expect(resolved).toContain("ㅏ");
  });

  it("keeps the original tile id for the first part and appends the second part with the next-available id", () => {
    // Pool: [combined(id 0), standalone(id 2), standalone(id 3)]
    // Splitting id 0: original keeps id 0 (parts[0]), new tile gets id 1 (next available), appended at end
    const state = makeState([
      tile(0, character("가")!),
      tile(2, character({ choseong: "ㄱ" })!),
      tile(3, character({ jungseong: "ㅏ" })!),
    ]);
    const next = handleCharacterDecompose(state, { tileId: 0 });
    expect(next.pool.map((t) => t.id)).toEqual([0, 2, 3, 1]);
  });

  it("updates the original tile in place and appends the extra tile to the end", () => {
    // Pool: [standalone(id 0), combined(id 1), standalone(id 2)]
    // Splitting id 1: original keeps id 1 (parts[0]), new tile gets id 3 (next available), appended at end
    const state = makeState([
      tile(0, character({ choseong: "ㄴ" })!),
      tile(1, character("가")!),
      tile(2, character({ jungseong: "ㅡ" })!),
    ]);
    const next = handleCharacterDecompose(state, { tileId: 1 });
    expect(next.pool).toHaveLength(4);
    expect(next.pool[0]!.id).toBe(0);
    expect(next.pool[1]!.id).toBe(1);
    expect(next.pool[2]!.id).toBe(2);
    expect(next.pool[3]!.id).toBe(3);
  });

  it.each([
    {
      label: "single-jamo tile",
      pool: [tile(0, character({ choseong: "ㄱ" })!)],
      payload: { tileId: 0 },
    },
    {
      label: "unknown tile id",
      pool: [tile(0, character({ choseong: "ㄱ" })!)],
      payload: { tileId: 99 },
    },
  ])("is a no-op for $label", ({ pool, payload }) => {
    const state = makeState(pool);
    expect(handleCharacterDecompose(state, payload)).toBe(state);
  });
});
