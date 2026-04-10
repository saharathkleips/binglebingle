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
    ["ㅏ", "ㅣ", "ㅐ"],
    ["ㅑ", "ㅣ", "ㅒ"],
    ["ㅓ", "ㅣ", "ㅔ"],
    ["ㅕ", "ㅣ", "ㅖ"],
    ["ㅗ", "ㅏ", "ㅘ"],
    ["ㅗ", "ㅐ", "ㅙ"], // canonical path
    ["ㅘ", "ㅣ", "ㅙ"], // alternate path: ㅘ+ㅣ (standard: ㅗ+ㅐ)
    ["ㅗ", "ㅣ", "ㅚ"],
    ["ㅜ", "ㅓ", "ㅝ"],
    ["ㅜ", "ㅔ", "ㅞ"], // canonical path
    ["ㅝ", "ㅣ", "ㅞ"], // alternate path: ㅝ+ㅣ (standard: ㅜ+ㅔ)
    ["ㅜ", "ㅣ", "ㅟ"],
    ["ㅡ", "ㅣ", "ㅢ"],
  ] as [VowelJamo, VowelJamo, VowelJamo][])("jungseong+jungseong (%s+%s → %s)", (a, b, expected) => {
    expect(compose({ jungseong: a }, { jungseong: b })).toEqual({ jungseong: expected });
  });

  it.each([
    ["ㅏ", "ㅏ"],
    ["ㅏ", "ㅓ"],
    ["ㅗ", "ㅓ"],
  ] as [VowelJamo, VowelJamo][])("jungseong + jungseong (not combinable: %s+%s) → null", (a, b) => {
    expect(compose({ jungseong: a }, { jungseong: b })).toBeNull();
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

  it("choseong+jungseong + jungseong (alternate path: ㅘ+ㅣ→ㅙ) → updated jungseong", () => {
    expect(compose({ choseong: "ㅎ", jungseong: "ㅘ" }, { jungseong: "ㅣ" })).toEqual({
      choseong: "ㅎ",
      jungseong: "ㅙ",
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
    ["ㄴ", "ㅈ", "ㄵ"],
    ["ㄴ", "ㅎ", "ㄶ"],
    ["ㄹ", "ㄱ", "ㄺ"],
    ["ㄹ", "ㅁ", "ㄻ"],
    ["ㄹ", "ㅂ", "ㄼ"],
    ["ㄹ", "ㅅ", "ㄽ"],
    ["ㄹ", "ㅌ", "ㄾ"],
    ["ㄹ", "ㅍ", "ㄿ"],
    ["ㄹ", "ㅎ", "ㅀ"],
    ["ㅂ", "ㅅ", "ㅄ"],
  ] as [JongseongJamo, ChoseongJamo, JongseongJamo][])("full + choseong (jongseong %s+%s → %s)", (jong, incoming, expected) => {
    expect(
      compose({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: jong }, { choseong: incoming }),
    ).toEqual({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: expected });
  });

  it("full + choseong (jongseong ㄱ+ㄱ → ㄲ, valid jongseong) → 갂", () => {
    expect(
      compose({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄱ" }, { choseong: "ㄱ" }),
    ).toEqual({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄲ" });
  });

  it("full + choseong (no combination rule: ㄱ+ㄴ) → null", () => {
    expect(
      compose({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄱ" }, { choseong: "ㄴ" }),
    ).toBeNull();
  });

  it("full + choseong (rule exists but result not valid jongseong: ㄷ+ㄷ → ㄸ) → null", () => {
    expect(
      compose({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄷ" }, { choseong: "ㄷ" }),
    ).toBeNull();
  });

  it("full + jungseong → null (no 4-part syllables)", () => {
    expect(
      compose({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" }, { jungseong: "ㅏ" }),
    ).toBeNull();
  });

  // Choseong-only → jongseong-only (compound batchim)
  it.each([
    ["ㄱ", "ㅅ", "ㄳ"],
    ["ㄴ", "ㅈ", "ㄵ"],
    ["ㄴ", "ㅎ", "ㄶ"],
    ["ㄹ", "ㄱ", "ㄺ"],
    ["ㄹ", "ㅁ", "ㄻ"],
    ["ㄹ", "ㅂ", "ㄼ"],
    ["ㄹ", "ㅅ", "ㄽ"],
    ["ㄹ", "ㅌ", "ㄾ"],
    ["ㄹ", "ㅍ", "ㄿ"],
    ["ㄹ", "ㅎ", "ㅀ"],
    ["ㅂ", "ㅅ", "ㅄ"],
  ] as [ChoseongJamo, ChoseongJamo, JongseongJamo][])(
    "choseong+choseong compound batchim (%s+%s → jongseong-only %s)",
    (a, b, expected) => {
      expect(compose({ choseong: a }, { choseong: b })).toEqual({ jongseong: expected });
    },
  );

  // Empty target accepts jongseong
  it("empty + jongseong → { jongseong }", () => {
    expect(compose({}, { jongseong: "ㄳ" })).toEqual({ jongseong: "ㄳ" });
  });

  it("empty + simple jongseong → { jongseong }", () => {
    expect(compose({}, { jongseong: "ㄱ" })).toEqual({ jongseong: "ㄱ" });
  });

  // Choseong + jungseong target accepts incoming jongseong
  it("choseong+jungseong + jongseong → full syllable", () => {
    expect(compose({ choseong: "ㄱ", jungseong: "ㅏ" }, { jongseong: "ㄳ" })).toEqual({
      choseong: "ㄱ",
      jungseong: "ㅏ",
      jongseong: "ㄳ",
    });
  });

  // Jongseong-only target
  it("jongseong-only + choseong (ㄱ+ㄱ → ㄲ choseong) → { choseong }", () => {
    expect(compose({ jongseong: "ㄱ" }, { choseong: "ㄱ" })).toEqual({ choseong: "ㄲ" });
  });

  it("jongseong-only + choseong (no double consonant: ㄱ+ㄴ) → null", () => {
    expect(compose({ jongseong: "ㄱ" }, { choseong: "ㄴ" })).toBeNull();
  });

  it("jongseong-only + jungseong → null", () => {
    expect(compose({ jongseong: "ㄱ" }, { jungseong: "ㅏ" })).toBeNull();
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
    [{ choseong: "ㄲ", jungseong: "ㅐ", jongseong: "ㄳ" }, "깫"], // double consonant + complex vowel + compound batchim
    [{ jongseong: "ㄳ" }, "ㄳ"], // jongseong-only renders as bare consonant
    [{ jongseong: "ㄱ" }, "ㄱ"], // simple jongseong-only renders as bare consonant
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
      [{ choseong: "ㄱ", jungseong: "ㅏ" }, { choseong: "ㄴ" }],
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
