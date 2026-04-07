import { describe, expect, it } from "vitest";

import { combineJamo, composeSyllable, decomposeSyllable, upgradeJongseong } from "./composition";

describe("combineJamo", () => {
  it("combines ㅏ+ㅣ to ㅐ", () => {
    expect(combineJamo("ㅏ", "ㅣ")).toBe("ㅐ");
  });

  it("is commutative: ㅣ+ㅏ also returns ㅐ", () => {
    expect(combineJamo("ㅣ", "ㅏ")).toBe("ㅐ");
  });

  it("combines ㄱ+ㄱ to ㄲ", () => {
    expect(combineJamo("ㄱ", "ㄱ")).toBe("ㄲ");
  });

  it("returns null for inputs with no rule", () => {
    expect(combineJamo("ㄱ", "ㅎ")).toBeNull();
  });

  it("returns null for compound batchim inputs", () => {
    // compound batchim are handled by upgradeJongseong, not combineJamo
    expect(combineJamo("ㄱ", "ㅅ")).toBeNull();
  });
});

describe("upgradeJongseong", () => {
  it("returns ㄳ for ㄱ+ㅅ", () => {
    expect(upgradeJongseong("ㄱ", "ㅅ")).toBe("ㄳ");
  });

  it("returns ㄺ for ㄹ+ㄱ", () => {
    expect(upgradeJongseong("ㄹ", "ㄱ")).toBe("ㄺ");
  });

  it("returns null for reversed arguments: ㅅ+ㄱ", () => {
    expect(upgradeJongseong("ㅅ", "ㄱ")).toBeNull();
  });

  it("returns null for inputs with no upgrade rule: ㄱ+ㄱ", () => {
    expect(upgradeJongseong("ㄱ", "ㄱ")).toBeNull();
  });
});

describe("composeSyllable", () => {
  it("composes 가 from ㄱ+ㅏ (no jongseong)", () => {
    expect(composeSyllable("ㄱ", "ㅏ")).toBe("가");
  });

  it("composes 한 from ㅎ+ㅏ+ㄴ", () => {
    expect(composeSyllable("ㅎ", "ㅏ", "ㄴ")).toBe("한");
  });

  it("composes 훿 from ㅎ+ㅞ+ㄳ (complex vowel + compound batchim)", () => {
    expect(composeSyllable("ㅎ", "ㅞ", "ㄳ")).toBe("훿");
  });

  it("composes 아 with silent ieung ㅇ as choseong", () => {
    expect(composeSyllable("ㅇ", "ㅏ")).toBe("아");
  });

  it("composes 따 with ㄸ as choseong (valid choseong, not valid jongseong)", () => {
    expect(composeSyllable("ㄸ", "ㅏ")).toBe("따");
  });

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
