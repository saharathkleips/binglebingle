import { describe, expect, it } from "vitest";
import { character, isComplete, resolveCharacter } from "./index";
import type { Character } from "./index";

// ---------------------------------------------------------------------------
// character() factory
// ---------------------------------------------------------------------------

describe("character() factory", () => {
  it.each([
    // Valid constructions — every kind
    ["no args → EMPTY", undefined, { kind: "EMPTY" }],
    ["empty slots → EMPTY", {}, { kind: "EMPTY" }],
    ["choseong only", { choseong: "ㄱ" }, { kind: "CHOSEONG_ONLY", choseong: "ㄱ" }],
    ["double consonant choseong", { choseong: "ㄲ" }, { kind: "CHOSEONG_ONLY", choseong: "ㄲ" }],
    ["jungseong only", { jungseong: "ㅏ" }, { kind: "JUNGSEONG_ONLY", jungseong: "ㅏ" }],
    ["complex vowel jungseong", { jungseong: "ㅘ" }, { kind: "JUNGSEONG_ONLY", jungseong: "ㅘ" }],
    ["jongseong only (simple)", { jongseong: "ㄱ" }, { kind: "JONGSEONG_ONLY", jongseong: "ㄱ" }],
    [
      "jongseong only (compound ㄳ)",
      { jongseong: "ㄳ" },
      { kind: "JONGSEONG_ONLY", jongseong: "ㄳ" },
    ],
    [
      "cho+jung → OPEN_SYLLABLE",
      { choseong: "ㄱ", jungseong: "ㅏ" },
      { kind: "OPEN_SYLLABLE", choseong: "ㄱ", jungseong: "ㅏ" },
    ],
    [
      "cho+jung+jong → FULL_SYLLABLE",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" },
      { kind: "FULL_SYLLABLE", choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" },
    ],

    // Invalid slot values → null (no cast needed: slots accept Jamo, factory validates)
    ["vowel ㅏ as choseong → null", { choseong: "ㅏ" }, null],
    ["consonant ㄱ as jungseong → null", { jungseong: "ㄱ" }, null],
    ["ㄸ as jongseong → null (no valid final)", { jongseong: "ㄸ" }, null],
    ["ㅃ as jongseong → null (no valid final)", { jongseong: "ㅃ" }, null],
    ["ㅉ as jongseong → null (no valid final)", { jongseong: "ㅉ" }, null],

    // Structural invalidity → null
    ["jung+jong without cho → null", { jungseong: "ㅏ", jongseong: "ㄱ" }, null],
  ] as [string, Parameters<typeof character>[0], Character | null][])(
    "%s",
    (_, slots, expected) => {
      expect(character(slots)).toEqual(expected);
    },
  );
});

// ---------------------------------------------------------------------------
// character() string overload
// ---------------------------------------------------------------------------

describe("character() string overload", () => {
  it.each([
    ["open syllable 가", "가", { kind: "OPEN_SYLLABLE", choseong: "ㄱ", jungseong: "ㅏ" }],
    [
      "full syllable 한",
      "한",
      { kind: "FULL_SYLLABLE", choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" },
    ],
    [
      "syllable with complex vowel 화",
      "화",
      { kind: "OPEN_SYLLABLE", choseong: "ㅎ", jungseong: "ㅘ" },
    ],
    [
      "syllable with compound batchim 닭",
      "닭",
      { kind: "FULL_SYLLABLE", choseong: "ㄷ", jungseong: "ㅏ", jongseong: "ㄺ" },
    ],
    ["empty string → null", "", null],
    ["raw jamo ㄱ (not a syllable block) → null", "ㄱ", null],
    ["Latin letter → null", "a", null],
  ] as [string, string, Character | null][])("%s", (_, input, expected) => {
    expect(character(input)).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// resolveCharacter()
// ---------------------------------------------------------------------------

describe("resolveCharacter", () => {
  it.each([
    [character(), null],
    [character({ choseong: "ㄱ" }), "ㄱ"],
    [character({ jungseong: "ㅏ" }), "ㅏ"],
    [character({ choseong: "ㄱ", jungseong: "ㅏ" }), "가"],
    [character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" }), "한"],
    [character({ choseong: "ㅎ", jungseong: "ㅞ", jongseong: "ㄳ" }), "훿"],
    [character({ choseong: "ㄲ", jungseong: "ㅐ", jongseong: "ㄳ" }), "깫"], // double consonant + complex vowel + compound batchim
    [character({ jongseong: "ㄳ" }), "ㄳ"], // jongseong-only renders as bare consonant
    [character({ jongseong: "ㄱ" }), "ㄱ"], // simple jongseong-only renders as bare consonant
  ] as [Character, string | null][])("resolveCharacter(%j) → %s", (char, expected) => {
    expect(resolveCharacter(char)).toBe(expected);
  });

  it("invalid combo (OPEN_SYLLABLE with consonant as jungseong) → null", () => {
    // Force an invalid jungseong via 'as any' to test composeSyllable boundary
    expect(
      resolveCharacter({ kind: "OPEN_SYLLABLE", choseong: "ㄱ", jungseong: "ㄱ" as any }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isComplete()
// ---------------------------------------------------------------------------

describe("isComplete", () => {
  it.each([
    [character({ choseong: "ㄱ", jungseong: "ㅏ" }), true],
    [character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" }), true],
    [character({ choseong: "ㄱ" }), false],
    [character({ jungseong: "ㅏ" }), false],
    [character(), false],
  ] as [Character, boolean][])("isComplete(%j) → %s", (char, expected) => {
    expect(isComplete(char)).toBe(expected);
  });
});
