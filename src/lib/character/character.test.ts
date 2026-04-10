/**
 * @file character.test.ts
 *
 * Tests for compose(), resolveCharacter(), isComplete(), decompose() —
 * the character assembly bridge.
 *
 * Tests written before implementation (TDD red phase).
 */

import { describe, expect, it } from "vitest";
import type { ChoseongJamo, VowelJamo } from "../jamo/jamo";
import type { JongseongJamo } from "../jamo/jamo";
import { compose, decompose, isComplete, resolveCharacter } from "./character";
import type { Character } from "./character";

// ---------------------------------------------------------------------------
// compose()
// ---------------------------------------------------------------------------

describe("compose", () => {
  // Empty target
  it("empty + choseong → { choseong }", () => {
    expect(compose({}, { choseong: "ㄱ" })).toEqual({ choseong: "ㄱ" });
  });

  it("empty + jungseong → { jungseong }", () => {
    expect(compose({}, { jungseong: "ㅏ" })).toEqual({ jungseong: "ㅏ" });
  });

  // Choseong-only target: double consonant upgrades
  it.each([
    ["ㄱ", "ㄲ"],
    ["ㄷ", "ㄸ"],
    ["ㅂ", "ㅃ"],
    ["ㅅ", "ㅆ"],
    ["ㅈ", "ㅉ"],
  ] as [ChoseongJamo, ChoseongJamo][])("choseong+choseong (%s+%s → double consonant)", (input, expected) => {
    expect(compose({ choseong: input }, { choseong: input })).toEqual({ choseong: expected });
  });

  it("choseong + choseong (not combinable: ㄱ+ㄴ) → null", () => {
    expect(compose({ choseong: "ㄱ" }, { choseong: "ㄴ" })).toBeNull();
  });

  it("choseong + jungseong → { choseong, jungseong }", () => {
    expect(compose({ choseong: "ㄱ" }, { jungseong: "ㅏ" })).toEqual({
      choseong: "ㄱ",
      jungseong: "ㅏ",
    });
  });

  // Jungseong-only target: complex vowel combinations
  it.each([
    ["ㅗ", "ㅏ", "ㅘ"],
    ["ㅜ", "ㅓ", "ㅝ"],
    ["ㅡ", "ㅣ", "ㅢ"],
  ] as [VowelJamo, VowelJamo, VowelJamo][])("jungseong+jungseong (%s+%s → %s)", (a, b, expected) => {
    expect(compose({ jungseong: a }, { jungseong: b })).toEqual({ jungseong: expected });
  });

  it("jungseong + jungseong (not combinable: ㅏ+ㅏ) → null", () => {
    expect(compose({ jungseong: "ㅏ" }, { jungseong: "ㅏ" })).toBeNull();
  });

  it("jungseong + choseong → { choseong: incoming, jungseong }", () => {
    expect(compose({ jungseong: "ㅏ" }, { choseong: "ㄱ" })).toEqual({
      choseong: "ㄱ",
      jungseong: "ㅏ",
    });
  });

  // Choseong + jungseong target
  it("choseong+jungseong + jungseong (combinable vowel: ㅗ+ㅏ→ㅘ) → updated jungseong", () => {
    expect(compose({ choseong: "ㅎ", jungseong: "ㅗ" }, { jungseong: "ㅏ" })).toEqual({
      choseong: "ㅎ",
      jungseong: "ㅘ",
    });
  });

  it("choseong+jungseong + jungseong (not combinable: ㅏ+ㅏ) → null", () => {
    expect(compose({ choseong: "ㄱ", jungseong: "ㅏ" }, { jungseong: "ㅏ" })).toBeNull();
  });

  it("choseong+jungseong + choseong → full syllable Character", () => {
    expect(compose({ choseong: "ㄱ", jungseong: "ㅏ" }, { choseong: "ㄴ" })).toEqual({
      choseong: "ㄱ",
      jungseong: "ㅏ",
      jongseong: "ㄴ",
    });
  });

  // Full (choseong+jungseong+jongseong) target: compound batchim upgrades
  it.each([
    ["ㄱ", "ㅅ", "ㄳ"],
    ["ㄹ", "ㄱ", "ㄺ"],
  ] as [JongseongJamo, ChoseongJamo, JongseongJamo][])("full + choseong (jongseong %s+%s → %s)", (jong, incoming, expected) => {
    expect(
      compose({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: jong }, { choseong: incoming }),
    ).toEqual({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: expected });
  });

  it("full + choseong (no upgrade rule: ㄱ+ㄱ) → null", () => {
    expect(
      compose({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄱ" }, { choseong: "ㄱ" }),
    ).toBeNull();
  });

  it("full + jungseong → null (no 4-part syllables)", () => {
    expect(
      compose({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" }, { jungseong: "ㅏ" }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveCharacter()
// ---------------------------------------------------------------------------

describe("resolveCharacter", () => {
  it.each([
    [{}, null],
    [{ choseong: "ㄱ" }, "ㄱ"],
    [{ jungseong: "ㅏ" }, "ㅏ"],
    [{ choseong: "ㄱ", jungseong: "ㅏ" }, "가"],
    [{ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" }, "한"],
    [{ choseong: "ㅎ", jungseong: "ㅞ", jongseong: "ㄳ" }, "훿"],
  ] as [Character, string | null][])("resolveCharacter(%j) → %s", (char, expected) => {
    expect(resolveCharacter(char)).toBe(expected);
  });

  it("invalid combo (choseong 'ㄱ' + jungseong 'ㄱ') → null", () => {
    // Use 'as any' to pass invalid type for testing boundary conditions
    expect(resolveCharacter({ choseong: "ㄱ", jungseong: "ㄱ" as any })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isComplete()
// ---------------------------------------------------------------------------

describe("isComplete", () => {
  it.each([
    [{ choseong: "ㄱ", jungseong: "ㅏ" }, true],
    [{ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" }, true],
    [{ choseong: "ㄱ" }, false],
    [{ jungseong: "ㅏ" }, false],  // jungseong-only is not a syllable block
    [{}, false],
  ] as [Character, boolean][])("isComplete(%j) → %s", (char, expected) => {
    expect(isComplete(char)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// decompose()
// ---------------------------------------------------------------------------

describe("decompose", () => {
  it.each([
    [
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" },
      [{ choseong: "ㄱ", jungseong: "ㅏ" }],
    ],
    [
      { choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄳ" },
      [{ choseong: "ㅎ", jungseong: "ㅏ" }, { choseong: "ㄱ" }, { choseong: "ㅅ" }],
    ],
    [
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄺ" },
      [{ choseong: "ㄱ", jungseong: "ㅏ" }, { choseong: "ㄹ" }, { choseong: "ㄱ" }],
    ],
    [{ choseong: "ㄱ", jungseong: "ㅏ" }, [{ choseong: "ㄱ" }]],
    [{ choseong: "ㄱ" }, []],
    [{}, []],
  ] as [Character, Character[]][])("decompose(%j)", (char, expected) => {
    expect(decompose(char)).toEqual(expected);
  });
});
