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

// Only canonical rules round-trip: for outputs with multiple input paths (ㅙ, ㅞ),
// DECOMPOSE_MAP keeps the last entry, so alternate-input rules are excluded here.
const CANONICAL_RULES = COMBINATION_RULES.filter(
  (rule, idx, arr) => arr.findLastIndex((r) => r.output === rule.output) === idx,
);

describe("decomposeJamo — round-trip", () => {
  it.each(CANONICAL_RULES)(
    "round-trip $kind: decomposeJamo(composeJamo($inputs)) returns inputs",
    ({ inputs, output }) => {
      expect(decomposeJamo(output)).toEqual(inputs);
    },
  );
});

describe("decomposeJamo — canonical paths for alternate-input vowels", () => {
  it("decomposeJamo('ㅙ') returns canonical ['ㅗ', 'ㅐ'], not alternate ['ㅘ', 'ㅣ']", () => {
    expect(decomposeJamo("ㅙ")).toEqual(["ㅗ", "ㅐ"]);
  });

  it("decomposeJamo('ㅞ') returns canonical ['ㅜ', 'ㅔ'], not alternate ['ㅝ', 'ㅣ']", () => {
    expect(decomposeJamo("ㅞ")).toEqual(["ㅜ", "ㅔ"]);
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
      expect(result!.jongseong).toBe(jong ?? null);
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
    if (jongseong !== null) {
      const jongCode = jongseong.codePointAt(0) ?? 0;
      expect(jongCode).toBeGreaterThanOrEqual(0x3130);
      expect(jongCode).toBeLessThanOrEqual(0x318f);
    }
  });
});
