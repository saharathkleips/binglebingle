import { describe, expect, it } from "vitest";

import { composeJamo, decomposeJamo, composeSyllable, decomposeSyllable } from "./composition";
import { COMBINATION_RULES, type CombinationRule } from "./composition";
import type { Jamo } from "./jamo";
import type { ChoseongJamo, VowelJamo, JongseongJamo } from "./jamo";

// Type guard to extract typed rules
const getTypedRules = (): CombinationRule[] => COMBINATION_RULES as CombinationRule[];

describe("composeJamo — all COMBINATION_RULES", () => {
  it.each(getTypedRules())(
    "$kind: $inputs → $output",
    ({ inputs, output }) => {
      expect(composeJamo(inputs[0], inputs[1])).toBe(output);
    },
  );
});

describe("decomposeJamo — round-trip", () => {
  it.each(getTypedRules())(
    "round-trip $kind: decomposeJamo(composeJamo($inputs)) returns inputs",
    ({ inputs, output }) => {
      expect(decomposeJamo(output)).toEqual(inputs);
    },
  );
});

describe("decomposeJamo — non-combination jamo", () => {
  const NON_COMBINATION: Jamo[] = [
    // Basic consonants
    "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
    // Vowels
    "ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ",
  ];

  it.each(NON_COMBINATION)("returns null for basic jamo %s", (jamo) => {
    expect(decomposeJamo(jamo)).toBeNull();
  });
});

describe("composeSyllable", () => {
  const COMPOSE_CASES: [ChoseongJamo, VowelJamo, JongseongJamo | undefined, string][] = [
    ["ㄱ", "ㅏ", undefined, "가"],
    ["ㅎ", "ㅏ", "ㄴ", "한"],
    ["ㅎ", "ㅞ", "ㄳ", "훿"],
    ["ㅇ", "ㅏ", undefined, "아"],
    ["ㄸ", "ㅏ", undefined, "따"],
    ["ㄴ", "ㅣ", undefined, "니"],
    ["ㅅ", "ㅓ", "ㄹ", "설"],
    ["ㅁ", "ㅜ", "ㄹ", "물"],
  ];

  it.each(COMPOSE_CASES)(
    "composeSyllable(%s, %s, %s) → %s",
    (cho, jung, jong, expected) => {
      expect(composeSyllable(cho, jung, jong)).toBe(expected);
    },
  );

  it("returns null when jongseong ㅃ is invalid", () => {
    expect(composeSyllable("ㅎ", "ㅏ", "ㅃ")).toBeNull();
  });

  it("returns null when jungseong position receives a consonant", () => {
    expect(composeSyllable("ㅎ", "ㄱ")).toBeNull();
  });
});

describe("decomposeSyllable", () => {
  it("decomposes 한 to { choseong:ㅎ, jungseong:ㅏ, jongseong:ㄴ }", () => {
    expect(decomposeSyllable("한")).toStrictEqual({
      choseong: "ㅎ",
      jungseong: "ㅏ",
      jongseong: "ㄴ",
    });
  });

  it("decomposes 가 to { choseong:ㄱ, jungseong:ㅏ, jongseong: null }", () => {
    expect(decomposeSyllable("가")).toStrictEqual({
      choseong: "ㄱ",
      jungseong: "ㅏ",
      jongseong: null,
    });
  });

  it("decomposes 훿 to { choseong:ㅎ, jungseong:ㅞ, jongseong:ㄳ }", () => {
    expect(decomposeSyllable("훿")).toStrictEqual({
      choseong: "ㅎ",
      jungseong: "ㅞ",
      jongseong: "ㄳ",
    });
  });

  it("returns null for a bare jamo (not a syllable block)", () => {
    expect(decomposeSyllable("ㄱ")).toBeNull();
  });

  it("returns null for a non-Korean character", () => {
    expect(decomposeSyllable("A")).toBeNull();
  });

  it("reads only first char — multi-syllable inputs silently truncate", () => {
    expect(decomposeSyllable("한국")).toStrictEqual({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" });
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

  it("round-trips: decompose(compose(ㅎ,ㅏ,ㄴ)) returns correct parts", () => {
    const syllable = composeSyllable("ㅎ", "ㅏ", "ㄴ");
    expect(syllable).not.toBeNull();
    const result = decomposeSyllable(syllable!);
    expect(result).toStrictEqual({
      choseong: "ㅎ",
      jungseong: "ㅏ",
      jongseong: "ㄴ",
    });
  });
});
