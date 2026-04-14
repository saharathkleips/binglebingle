import { describe, expect, it } from "vitest";

import { composeJamo, decomposeJamo, composeSyllable, decomposeSyllable } from "./composition";
import { COMBINATION_RULES } from "./composition";
import type { Jamo } from "./jamo";
import type { ChoseongJamo, VowelJamo, JongseongJamo } from "./jamo";

describe("composeJamo — all COMBINATION_RULES", () => {
  it.each(COMBINATION_RULES)("$kind: $inputs → $output", ({ inputs, output }) => {
    expect(composeJamo(inputs[0], inputs[1])).toBe(output);
  });
});

// Only canonical rules round-trip: alternate-input rules (alternate: true) are excluded
// from DECOMPOSE_MAP, so decomposeJamo returns the canonical path, not the alternate path.
const CANONICAL_RULES = COMBINATION_RULES.filter((rule) => !rule.alternate);

describe("decomposeJamo — round-trip", () => {
  it.each(CANONICAL_RULES)(
    "round-trip $kind: decomposeJamo(composeJamo($inputs)) returns inputs",
    ({ inputs, output }) => {
      expect(decomposeJamo(output)).toEqual(inputs);
    },
  );
});

describe("decomposeJamo — canonical paths for alternate-input vowels", () => {
  it("decomposeJamo('ㅙ') returns canonical ['ㅘ', 'ㅣ'], not alternate ['ㅗ', 'ㅐ']", () => {
    expect(decomposeJamo("ㅙ")).toEqual(["ㅘ", "ㅣ"]);
  });

  it("decomposeJamo('ㅞ') returns canonical ['ㅝ', 'ㅣ'], not alternate ['ㅜ', 'ㅔ']", () => {
    expect(decomposeJamo("ㅞ")).toEqual(["ㅝ", "ㅣ"]);
  });
});

describe("composeJamo — alternate input paths", () => {
  it("composeJamo('ㅘ', 'ㅣ') → 'ㅙ'", () => {
    expect(composeJamo("ㅘ", "ㅣ")).toBe("ㅙ");
  });

  it("composeJamo('ㅣ', 'ㅘ') → 'ㅙ' (commutative)", () => {
    expect(composeJamo("ㅣ", "ㅘ")).toBe("ㅙ");
  });

  it("composeJamo('ㅝ', 'ㅣ') → 'ㅞ'", () => {
    expect(composeJamo("ㅝ", "ㅣ")).toBe("ㅞ");
  });

  it("composeJamo('ㅣ', 'ㅝ') → 'ㅞ' (commutative)", () => {
    expect(composeJamo("ㅣ", "ㅝ")).toBe("ㅞ");
  });
});

describe("decomposeJamo — non-combination jamo", () => {
  const NON_COMBINATION: Jamo[] = [
    // Basic consonants
    "ㄱ",
    "ㄴ",
    "ㄷ",
    "ㄹ",
    "ㅁ",
    "ㅂ",
    "ㅅ",
    "ㅇ",
    "ㅈ",
    "ㅊ",
    "ㅋ",
    "ㅌ",
    "ㅍ",
    "ㅎ",
    // Vowels
    "ㅏ",
    "ㅑ",
    "ㅓ",
    "ㅕ",
    "ㅗ",
    "ㅛ",
    "ㅜ",
    "ㅠ",
    "ㅡ",
    "ㅣ",
  ];

  it.each(NON_COMBINATION)("returns null for basic jamo %s", (jamo) => {
    expect(decomposeJamo(jamo)).toBeNull();
  });
});

// Shared table for composeSyllable and decomposeSyllable happy-path tests
const SYLLABLE_CASES: [ChoseongJamo, VowelJamo, JongseongJamo | undefined, string][] = [
  ["ㄱ", "ㅏ", undefined, "가"],
  ["ㅎ", "ㅏ", "ㄴ", "한"],
  ["ㅎ", "ㅞ", "ㄳ", "훿"],
  ["ㅇ", "ㅏ", undefined, "아"],
  ["ㄸ", "ㅏ", undefined, "따"],
  ["ㄴ", "ㅣ", undefined, "니"],
  ["ㅅ", "ㅓ", "ㄹ", "설"],
  ["ㅁ", "ㅜ", "ㄹ", "물"],
];

describe("composeSyllable", () => {
  it.each(SYLLABLE_CASES)("composeSyllable(%s, %s, %s) → %s", (cho, jung, jong, expected) => {
    expect(composeSyllable(cho, jung, jong)).toBe(expected);
  });

  it("returns null when jongseong is invalid (double consonant ㅃ)", () => {
    // Use 'as any' to pass invalid type for testing boundary conditions
    expect(composeSyllable("ㅎ", "ㅏ", "ㅃ" as any)).toBeNull();
  });

  it("returns null when jungseong position receives a consonant", () => {
    // Use 'as any' to pass invalid type for testing boundary conditions
    expect(composeSyllable("ㅎ", "ㄱ" as any)).toBeNull();
  });
});

describe("decomposeSyllable", () => {
  it.each(SYLLABLE_CASES)(
    "round-trip: decomposeSyllable(composeSyllable(%s, %s, %s)) returns correct components",
    (cho, jung, jong, _expected) => {
      const syllable = composeSyllable(cho, jung, jong);
      expect(syllable).not.toBeNull();
      const result = decomposeSyllable(syllable!);
      expect(result).not.toBeNull();
      expect(result!.choseong).toBe(cho);
      expect(result!.jungseong).toBe(jung);
      expect(result!.jongseong).toBe(jong);
    },
  );

  it("returns null for a bare jamo (not a syllable block)", () => {
    expect(decomposeSyllable("ㄱ")).toBeNull();
  });

  it("returns null for a non-Korean character", () => {
    expect(decomposeSyllable("A")).toBeNull();
  });

  it("reads only first char — multi-syllable inputs silently truncate", () => {
    expect(decomposeSyllable("한국")).toStrictEqual({
      choseong: "ㅎ",
      jungseong: "ㅏ",
      jongseong: "ㄴ",
    });
  });

  it("all decomposed jamo use Compatibility Jamo codepoints (0x3130–0x318F)", () => {
    const result = decomposeSyllable("한");
    expect(result).not.toBeNull();
    if (result === null) return;
    const { choseong, jungseong, jongseong } = result;
    const choCode = choseong.codePointAt(0) ?? 0;
    const jungCode = jungseong.codePointAt(0) ?? 0;
    expect(choCode).toBeGreaterThanOrEqual(0x3130);
    expect(choCode).toBeLessThanOrEqual(0x318f);
    expect(jungCode).toBeGreaterThanOrEqual(0x3130);
    expect(jungCode).toBeLessThanOrEqual(0x318f);
    if (jongseong !== undefined) {
      const jongCode = jongseong.codePointAt(0) ?? 0;
      expect(jongCode).toBeGreaterThanOrEqual(0x3130);
      expect(jongCode).toBeLessThanOrEqual(0x318f);
    }
  });
});
