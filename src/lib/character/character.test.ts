import { describe, expect, it } from "vitest";
import type { Character } from "./character";
import { compose, decompose, isComplete, resolveCharacter } from "./character";

// ---------------------------------------------------------------------------
// compose()
// ---------------------------------------------------------------------------

describe("compose", () => {
  it.each([
    // --- Empty target ---
    ["empty + choseong", {}, { choseong: "ㄱ" }, { choseong: "ㄱ" }],
    ["empty + jungseong", {}, { jungseong: "ㅏ" }, { jungseong: "ㅏ" }],
    ["empty + simple jongseong", {}, { jongseong: "ㄱ" }, { jongseong: "ㄱ" }],
    ["empty + compound jongseong", {}, { jongseong: "ㄳ" }, { jongseong: "ㄳ" }],

    // --- Choseong-only: double consonant → choseong ---
    ["cho(ㄱ)+cho(ㄱ) → ㄲ", { choseong: "ㄱ" }, { choseong: "ㄱ" }, { choseong: "ㄲ" }],
    ["cho(ㄷ)+cho(ㄷ) → ㄸ", { choseong: "ㄷ" }, { choseong: "ㄷ" }, { choseong: "ㄸ" }],
    ["cho(ㅂ)+cho(ㅂ) → ㅃ", { choseong: "ㅂ" }, { choseong: "ㅂ" }, { choseong: "ㅃ" }],
    ["cho(ㅅ)+cho(ㅅ) → ㅆ", { choseong: "ㅅ" }, { choseong: "ㅅ" }, { choseong: "ㅆ" }],
    ["cho(ㅈ)+cho(ㅈ) → ㅉ", { choseong: "ㅈ" }, { choseong: "ㅈ" }, { choseong: "ㅉ" }],

    // --- Choseong-only: compound batchim → jongseong-only ---
    ["cho(ㄱ)+cho(ㅅ) → jong(ㄳ)", { choseong: "ㄱ" }, { choseong: "ㅅ" }, { jongseong: "ㄳ" }],
    ["cho(ㄴ)+cho(ㅈ) → jong(ㄵ)", { choseong: "ㄴ" }, { choseong: "ㅈ" }, { jongseong: "ㄵ" }],
    ["cho(ㄴ)+cho(ㅎ) → jong(ㄶ)", { choseong: "ㄴ" }, { choseong: "ㅎ" }, { jongseong: "ㄶ" }],
    ["cho(ㄹ)+cho(ㄱ) → jong(ㄺ)", { choseong: "ㄹ" }, { choseong: "ㄱ" }, { jongseong: "ㄺ" }],
    ["cho(ㄹ)+cho(ㅁ) → jong(ㄻ)", { choseong: "ㄹ" }, { choseong: "ㅁ" }, { jongseong: "ㄻ" }],
    ["cho(ㄹ)+cho(ㅂ) → jong(ㄼ)", { choseong: "ㄹ" }, { choseong: "ㅂ" }, { jongseong: "ㄼ" }],
    ["cho(ㄹ)+cho(ㅅ) → jong(ㄽ)", { choseong: "ㄹ" }, { choseong: "ㅅ" }, { jongseong: "ㄽ" }],
    ["cho(ㄹ)+cho(ㅌ) → jong(ㄾ)", { choseong: "ㄹ" }, { choseong: "ㅌ" }, { jongseong: "ㄾ" }],
    ["cho(ㄹ)+cho(ㅍ) → jong(ㄿ)", { choseong: "ㄹ" }, { choseong: "ㅍ" }, { jongseong: "ㄿ" }],
    ["cho(ㄹ)+cho(ㅎ) → jong(ㅀ)", { choseong: "ㄹ" }, { choseong: "ㅎ" }, { jongseong: "ㅀ" }],
    ["cho(ㅂ)+cho(ㅅ) → jong(ㅄ)", { choseong: "ㅂ" }, { choseong: "ㅅ" }, { jongseong: "ㅄ" }],

    // --- Choseong-only: other ---
    [
      "cho(ㄱ)+jung(ㅏ) → open syllable",
      { choseong: "ㄱ" },
      { jungseong: "ㅏ" },
      { choseong: "ㄱ", jungseong: "ㅏ" },
    ],
    ["cho(ㄱ)+cho(ㄴ) → null (no rule)", { choseong: "ㄱ" }, { choseong: "ㄴ" }, null],

    // --- Jungseong-only: complex vowel combinations ---
    ["jung(ㅏ)+jung(ㅣ) → ㅐ", { jungseong: "ㅏ" }, { jungseong: "ㅣ" }, { jungseong: "ㅐ" }],
    ["jung(ㅑ)+jung(ㅣ) → ㅒ", { jungseong: "ㅑ" }, { jungseong: "ㅣ" }, { jungseong: "ㅒ" }],
    ["jung(ㅓ)+jung(ㅣ) → ㅔ", { jungseong: "ㅓ" }, { jungseong: "ㅣ" }, { jungseong: "ㅔ" }],
    ["jung(ㅕ)+jung(ㅣ) → ㅖ", { jungseong: "ㅕ" }, { jungseong: "ㅣ" }, { jungseong: "ㅖ" }],
    ["jung(ㅗ)+jung(ㅏ) → ㅘ", { jungseong: "ㅗ" }, { jungseong: "ㅏ" }, { jungseong: "ㅘ" }],
    [
      "jung(ㅗ)+jung(ㅐ) → ㅙ (canonical)",
      { jungseong: "ㅗ" },
      { jungseong: "ㅐ" },
      { jungseong: "ㅙ" },
    ],
    [
      "jung(ㅘ)+jung(ㅣ) → ㅙ (alternate path)",
      { jungseong: "ㅘ" },
      { jungseong: "ㅣ" },
      { jungseong: "ㅙ" },
    ],
    ["jung(ㅗ)+jung(ㅣ) → ㅚ", { jungseong: "ㅗ" }, { jungseong: "ㅣ" }, { jungseong: "ㅚ" }],
    ["jung(ㅜ)+jung(ㅓ) → ㅝ", { jungseong: "ㅜ" }, { jungseong: "ㅓ" }, { jungseong: "ㅝ" }],
    [
      "jung(ㅜ)+jung(ㅔ) → ㅞ (canonical)",
      { jungseong: "ㅜ" },
      { jungseong: "ㅔ" },
      { jungseong: "ㅞ" },
    ],
    [
      "jung(ㅝ)+jung(ㅣ) → ㅞ (alternate path)",
      { jungseong: "ㅝ" },
      { jungseong: "ㅣ" },
      { jungseong: "ㅞ" },
    ],
    ["jung(ㅜ)+jung(ㅣ) → ㅟ", { jungseong: "ㅜ" }, { jungseong: "ㅣ" }, { jungseong: "ㅟ" }],
    ["jung(ㅡ)+jung(ㅣ) → ㅢ", { jungseong: "ㅡ" }, { jungseong: "ㅣ" }, { jungseong: "ㅢ" }],

    // --- Jungseong-only: other ---
    ["jung(ㅏ)+jung(ㅏ) → null (not combinable)", { jungseong: "ㅏ" }, { jungseong: "ㅏ" }, null],
    ["jung(ㅏ)+jung(ㅓ) → null (not combinable)", { jungseong: "ㅏ" }, { jungseong: "ㅓ" }, null],
    ["jung(ㅗ)+jung(ㅓ) → null (not combinable)", { jungseong: "ㅗ" }, { jungseong: "ㅓ" }, null],
    [
      "jung(ㅏ)+cho(ㄱ) → rearranged: cho leads",
      { jungseong: "ㅏ" },
      { choseong: "ㄱ" },
      { choseong: "ㄱ", jungseong: "ㅏ" },
    ],

    // --- Choseong+jungseong: vowel combination ---
    [
      "cho+jung(ㅗ) + jung(ㅏ) → ㅘ",
      { choseong: "ㅎ", jungseong: "ㅗ" },
      { jungseong: "ㅏ" },
      { choseong: "ㅎ", jungseong: "ㅘ" },
    ],
    [
      "cho+jung(ㅘ) + jung(ㅣ) → ㅙ (alternate)",
      { choseong: "ㅎ", jungseong: "ㅘ" },
      { jungseong: "ㅣ" },
      { choseong: "ㅎ", jungseong: "ㅙ" },
    ],
    [
      "cho+jung(ㅏ) + jung(ㅏ) → null",
      { choseong: "ㄱ", jungseong: "ㅏ" },
      { jungseong: "ㅏ" },
      null,
    ],

    // --- Choseong+jungseong: incoming consonant or jongseong → jongseong slot ---
    [
      "cho+jung + cho(ㄴ) → full syllable",
      { choseong: "ㄱ", jungseong: "ㅏ" },
      { choseong: "ㄴ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" },
    ],
    [
      "cho+jung + jong(ㄳ) → full syllable (direct)",
      { choseong: "ㄱ", jungseong: "ㅏ" },
      { jongseong: "ㄳ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄳ" },
    ],

    // --- Full (choseong+jungseong+jongseong): compound batchim upgrade ---
    [
      "full(jong ㄱ)+cho(ㅅ) → jong ㄳ",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄱ" },
      { choseong: "ㅅ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄳ" },
    ],
    [
      "full(jong ㄴ)+cho(ㅈ) → jong ㄵ",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" },
      { choseong: "ㅈ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄵ" },
    ],
    [
      "full(jong ㄴ)+cho(ㅎ) → jong ㄶ",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" },
      { choseong: "ㅎ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄶ" },
    ],
    [
      "full(jong ㄹ)+cho(ㄱ) → jong ㄺ",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" },
      { choseong: "ㄱ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄺ" },
    ],
    [
      "full(jong ㄹ)+cho(ㅁ) → jong ㄻ",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" },
      { choseong: "ㅁ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄻ" },
    ],
    [
      "full(jong ㄹ)+cho(ㅂ) → jong ㄼ",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" },
      { choseong: "ㅂ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄼ" },
    ],
    [
      "full(jong ㄹ)+cho(ㅅ) → jong ㄽ",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" },
      { choseong: "ㅅ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄽ" },
    ],
    [
      "full(jong ㄹ)+cho(ㅌ) → jong ㄾ",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" },
      { choseong: "ㅌ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄾ" },
    ],
    [
      "full(jong ㄹ)+cho(ㅍ) → jong ㄿ",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" },
      { choseong: "ㅍ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄿ" },
    ],
    [
      "full(jong ㄹ)+cho(ㅎ) → jong ㅀ",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" },
      { choseong: "ㅎ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㅀ" },
    ],
    [
      "full(jong ㅂ)+cho(ㅅ) → jong ㅄ",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㅂ" },
      { choseong: "ㅅ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㅄ" },
    ],

    // --- Full: double consonant jongseong ---
    [
      "full(jong ㄱ)+cho(ㄱ) → jong ㄲ (valid jongseong)",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄱ" },
      { choseong: "ㄱ" },
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄲ" },
    ],

    // --- Full: null cases ---
    [
      "full(jong ㄱ)+cho(ㄴ) → null (no rule)",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄱ" },
      { choseong: "ㄴ" },
      null,
    ],
    [
      "full(jong ㄷ)+cho(ㄷ) → null (ㄸ not valid jongseong)",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄷ" },
      { choseong: "ㄷ" },
      null,
    ],
    [
      "full + jung → null (no 4-part syllables)",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" },
      { jungseong: "ㅏ" },
      null,
    ],

    // --- Jongseong-only ---
    [
      "jong(ㄱ)+cho(ㄱ) → cho ㄲ (double consonant)",
      { jongseong: "ㄱ" },
      { choseong: "ㄱ" },
      { choseong: "ㄲ" },
    ],
    [
      "jong(ㄱ)+cho(ㄴ) → null (no double consonant)",
      { jongseong: "ㄱ" },
      { choseong: "ㄴ" },
      null,
    ],
    ["jong(ㄱ)+jung(ㅏ) → null", { jongseong: "ㄱ" }, { jungseong: "ㅏ" }, null],
  ] as [string, Character, Character, Character | null][])(
    "%s",
    (_, target, incoming, expected) => {
      expect(compose(target, incoming)).toEqual(expected);
    },
  );
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
    [{ jungseong: "ㅏ" }, false], // jungseong-only is not a syllable block
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
    // --- Empty ---
    ["empty → []", {}, []],

    // --- Single jamo: no loss ---
    ["choseong-only → [choseong]", { choseong: "ㄱ" }, [{ choseong: "ㄱ" }]],
    ["jungseong-only → [jungseong]", { jungseong: "ㅏ" }, [{ jungseong: "ㅏ" }]],
    ["simple jongseong-only → [jongseong]", { jongseong: "ㄱ" }, [{ jongseong: "ㄱ" }]],

    // --- Jongseong-only compound batchim splits into two choseong ---
    [
      "compound jongseong ㄳ → [cho ㄱ, cho ㅅ]",
      { jongseong: "ㄳ" },
      [{ choseong: "ㄱ" }, { choseong: "ㅅ" }],
    ],
    [
      "compound jongseong ㄺ → [cho ㄹ, cho ㄱ]",
      { jongseong: "ㄺ" },
      [{ choseong: "ㄹ" }, { choseong: "ㄱ" }],
    ],
    [
      "compound jongseong ㄻ → [cho ㄹ, cho ㅁ]",
      { jongseong: "ㄻ" },
      [{ choseong: "ㄹ" }, { choseong: "ㅁ" }],
    ],
    [
      "compound jongseong ㄼ → [cho ㄹ, cho ㅂ]",
      { jongseong: "ㄼ" },
      [{ choseong: "ㄹ" }, { choseong: "ㅂ" }],
    ],
    [
      "compound jongseong ㅄ → [cho ㅂ, cho ㅅ]",
      { jongseong: "ㅄ" },
      [{ choseong: "ㅂ" }, { choseong: "ㅅ" }],
    ],

    // --- Choseong-only double consonants: split into two consonants ---
    [
      "double consonant ㄲ → [cho ㄱ, cho ㄱ]",
      { choseong: "ㄲ" },
      [{ choseong: "ㄱ" }, { choseong: "ㄱ" }],
    ],
    [
      "double consonant ㅆ → [cho ㅅ, cho ㅅ]",
      { choseong: "ㅆ" },
      [{ choseong: "ㅅ" }, { choseong: "ㅅ" }],
    ],

    // --- Jungseong-only complex vowels: split (canonical decompose path) ---
    [
      "complex vowel ㅐ (2-jamo) → [jung ㅏ, jung ㅣ]",
      { jungseong: "ㅐ" },
      [{ jungseong: "ㅏ" }, { jungseong: "ㅣ" }],
    ],
    [
      "complex vowel ㅘ (2-jamo) → [jung ㅗ, jung ㅏ]",
      { jungseong: "ㅘ" },
      [{ jungseong: "ㅗ" }, { jungseong: "ㅏ" }],
    ],
    [
      "complex vowel ㅙ (3-jamo, canonical ㅗ+ㅐ) → [jung ㅗ, jung ㅐ]",
      { jungseong: "ㅙ" },
      [{ jungseong: "ㅗ" }, { jungseong: "ㅐ" }],
    ],

    // --- Choseong + jungseong: peel off jungseong ---
    [
      "cho+jung → [cho, jung]",
      { choseong: "ㄱ", jungseong: "ㅏ" },
      [{ choseong: "ㄱ" }, { jungseong: "ㅏ" }],
    ],
    [
      "cho+jung(ㅘ) → [cho, jung ㅘ] (complex vowel preserved)",
      { choseong: "ㄱ", jungseong: "ㅘ" },
      [{ choseong: "ㄱ" }, { jungseong: "ㅘ" }],
    ],

    // --- Full syllable, simple jongseong: peel off as choseong ---
    [
      "full, simple jong ㄴ → [cho+jung, cho ㄴ]",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" },
      [{ choseong: "ㄱ", jungseong: "ㅏ" }, { choseong: "ㄴ" }],
    ],
    [
      "full, double consonant jong ㄲ → [cho+jung, cho ㄲ]",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄲ" },
      [{ choseong: "ㄱ", jungseong: "ㅏ" }, { choseong: "ㄲ" }],
    ],

    // --- Full syllable, compound batchim: stays intact (at most 2 results) ---
    [
      "full, compound jong ㄳ → [cho+jung, jong ㄳ]",
      { choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄳ" },
      [{ choseong: "ㅎ", jungseong: "ㅏ" }, { jongseong: "ㄳ" }],
    ],
    [
      "full, compound jong ㄺ → [cho+jung, jong ㄺ]",
      { choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄺ" },
      [{ choseong: "ㄱ", jungseong: "ㅏ" }, { jongseong: "ㄺ" }],
    ],
    [
      "full, compound jong ㅄ → [cho+jung, jong ㅄ]",
      { choseong: "ㅂ", jungseong: "ㅓ", jongseong: "ㅄ" },
      [{ choseong: "ㅂ", jungseong: "ㅓ" }, { jongseong: "ㅄ" }],
    ],
  ] as [string, Character, Character[]][])("%s", (_, char, expected) => {
    expect(decompose(char)).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// Full jamo workflow: step-by-step decompose → recompose
// ---------------------------------------------------------------------------

describe("full jamo workflow: 호 (2 jamo: ㅎ ㅗ)", () => {
  it("decomposes cho+jung → [cho, jung]", () => {
    expect(decompose({ choseong: "ㅎ", jungseong: "ㅗ" })).toEqual([
      { choseong: "ㅎ" },
      { jungseong: "ㅗ" },
    ]);
  });
  it("recomposes ㅎ → ㅎ+ㅗ → 호", () => {
    expect(compose({}, { choseong: "ㅎ" })).toEqual({ choseong: "ㅎ" });
    expect(compose({ choseong: "ㅎ" }, { jungseong: "ㅗ" })).toEqual({
      choseong: "ㅎ",
      jungseong: "ㅗ",
    });
    expect(resolveCharacter({ choseong: "ㅎ", jungseong: "ㅗ" })).toBe("호");
  });
});

describe("full jamo workflow: 화 (3 jamo: ㅎ ㅗ ㅏ)", () => {
  it("decomposes cho+jung(ㅘ) → [cho, jung(ㅘ)], then jung(ㅘ) → [ㅗ, ㅏ]", () => {
    expect(decompose({ choseong: "ㅎ", jungseong: "ㅘ" })).toEqual([
      { choseong: "ㅎ" },
      { jungseong: "ㅘ" },
    ]);
    expect(decompose({ jungseong: "ㅘ" })).toEqual([{ jungseong: "ㅗ" }, { jungseong: "ㅏ" }]);
  });
  it("recomposes ㅎ → ㅎ+ㅗ → ㅎ+ㅘ → 화", () => {
    expect(compose({ choseong: "ㅎ" }, { jungseong: "ㅗ" })).toEqual({
      choseong: "ㅎ",
      jungseong: "ㅗ",
    });
    expect(compose({ choseong: "ㅎ", jungseong: "ㅗ" }, { jungseong: "ㅏ" })).toEqual({
      choseong: "ㅎ",
      jungseong: "ㅘ",
    });
    expect(resolveCharacter({ choseong: "ㅎ", jungseong: "ㅘ" })).toBe("화");
  });
});

describe("full jamo workflow: 홰 (4 jamo: ㅎ ㅗ ㅏ ㅣ)", () => {
  it("decomposes cho+jung(ㅙ) → [cho, jung(ㅙ)], then ㅙ → [ㅗ, ㅐ] (canonical), then ㅐ → [ㅏ, ㅣ]", () => {
    expect(decompose({ choseong: "ㅎ", jungseong: "ㅙ" })).toEqual([
      { choseong: "ㅎ" },
      { jungseong: "ㅙ" },
    ]);
    expect(decompose({ jungseong: "ㅙ" })).toEqual([{ jungseong: "ㅗ" }, { jungseong: "ㅐ" }]);
    expect(decompose({ jungseong: "ㅐ" })).toEqual([{ jungseong: "ㅏ" }, { jungseong: "ㅣ" }]);
  });
  it("recomposes ㅎ → ㅎ+ㅗ → ㅎ+ㅘ → ㅎ+ㅙ → 홰", () => {
    expect(compose({ choseong: "ㅎ" }, { jungseong: "ㅗ" })).toEqual({
      choseong: "ㅎ",
      jungseong: "ㅗ",
    });
    expect(compose({ choseong: "ㅎ", jungseong: "ㅗ" }, { jungseong: "ㅏ" })).toEqual({
      choseong: "ㅎ",
      jungseong: "ㅘ",
    });
    expect(compose({ choseong: "ㅎ", jungseong: "ㅘ" }, { jungseong: "ㅣ" })).toEqual({
      choseong: "ㅎ",
      jungseong: "ㅙ",
    });
    expect(resolveCharacter({ choseong: "ㅎ", jungseong: "ㅙ" })).toBe("홰");
  });
});

describe("full jamo workflow: 홱 (5 jamo: ㅎ ㅗ ㅏ ㅣ ㄱ)", () => {
  it("decomposes full(ㅙ,ㄱ) → [cho+jung(ㅙ), cho(ㄱ)], vowel steps same as 홰", () => {
    expect(decompose({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄱ" })).toEqual([
      { choseong: "ㅎ", jungseong: "ㅙ" },
      { choseong: "ㄱ" },
    ]);
  });
  it("recomposes ㅎ+ㅗ+ㅏ+ㅣ → ㅎ+ㅙ, then +ㄱ → 홱", () => {
    expect(compose({ choseong: "ㅎ", jungseong: "ㅙ" }, { choseong: "ㄱ" })).toEqual({
      choseong: "ㅎ",
      jungseong: "ㅙ",
      jongseong: "ㄱ",
    });
    expect(resolveCharacter({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄱ" })).toBe("홱");
  });
});

describe("full jamo workflow: 홳 (6 jamo: ㅎ ㅗ ㅏ ㅣ ㄱ ㅅ)", () => {
  it("decomposes full(ㅙ,ㄳ) → [cho+jung(ㅙ), jong(ㄳ)], then ㄳ → [cho ㄱ, cho ㅅ]", () => {
    expect(decompose({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄳ" })).toEqual([
      { choseong: "ㅎ", jungseong: "ㅙ" },
      { jongseong: "ㄳ" },
    ]);
    expect(decompose({ jongseong: "ㄳ" })).toEqual([{ choseong: "ㄱ" }, { choseong: "ㅅ" }]);
  });
  it("recomposes ㅎ+ㅙ+ㄱ → 홱, then +ㅅ → jong ㄳ → 홳", () => {
    expect(
      compose({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄱ" }, { choseong: "ㅅ" }),
    ).toEqual({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄳ" });
    expect(resolveCharacter({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄳ" })).toBe("홳");
  });
});
