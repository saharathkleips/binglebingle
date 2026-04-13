import { describe, expect, it } from "vitest";
import { createWord, decomposeJamo, derivePool, normalizePool } from "./word";

describe("createWord", () => {
  it("returns a branded Word when given a valid Korean syllable block string", () => {
    const result = createWord("한국어");
    expect(result).toBe("한국어");
  });

  it("returns null when given an empty string", () => {
    expect(createWord("")).toBeNull();
  });

  it("returns null when any character is outside the syllable block range", () => {
    // Latin character
    expect(createWord("한A")).toBeNull();
    // Jamo directly (not a syllable block)
    expect(createWord("ㄱ")).toBeNull();
    // Mixed with ASCII digit
    expect(createWord("한1")).toBeNull();
  });

  it("accepts single-character words", () => {
    expect(createWord("가")).toBe("가");
  });

  it("accepts the full syllable range boundaries", () => {
    // U+AC00 (가) and U+D7A3 (힣)
    expect(createWord("\uAC00")).toBe("\uAC00");
    expect(createWord("\uD7A3")).toBe("\uD7A3");
  });
});

describe("decomposeJamo", () => {
  it("decomposes a complex vowel one step into its two constituents", () => {
    // ㅐ → [ㅏ, ㅣ]
    expect(decomposeJamo("ㅐ")).toEqual(["ㅏ", "ㅣ"]);
  });

  it("decomposes ㅙ one step (canonical: ㅘ + ㅣ, not three-way)", () => {
    expect(decomposeJamo("ㅙ")).toEqual(["ㅘ", "ㅣ"]);
  });

  it("decomposes a compound batchim one step", () => {
    // ㄳ → [ㄱ, ㅅ]
    expect(decomposeJamo("ㄳ")).toEqual(["ㄱ", "ㅅ"]);
  });

  it("returns the jamo unchanged when it is a basic jamo with no rule", () => {
    expect(decomposeJamo("ㄱ")).toEqual(["ㄱ"]);
    expect(decomposeJamo("ㅏ")).toEqual(["ㅏ"]);
  });
});

describe("derivePool", () => {
  it("decomposes 한국어 into the correct flat basic jamo array", () => {
    const word = createWord("한국어");
    expect(word).not.toBeNull();
    // 한 = ㅎ + ㅏ + ㄴ; 국 = ㄱ + ㅜ + ㄱ; 어 = ㅇ + ㅓ (no jongseong)
    expect(derivePool(word!)).toEqual(["ㅎ", "ㅏ", "ㄴ", "ㄱ", "ㅜ", "ㄱ", "ㅇ", "ㅓ"]);
  });

  it("fully decomposes a syllable with compound jongseong ㄳ", () => {
    // 각 = ㄱ + ㅏ + ㄱ, but use a syllable with ㄳ
    // 닭 has compound batchim ㄺ = ㄹ + ㄱ; 닭 = ㄷ + ㅏ + ㄺ
    const word = createWord("닭");
    expect(word).not.toBeNull();
    expect(derivePool(word!)).toEqual(["ㄷ", "ㅏ", "ㄹ", "ㄱ"]);
  });

  it("fully decomposes a syllable with complex vowel (훿 → ㅎ ㅜ ㅓ ㅣ ㄱ ㅅ)", () => {
    // 훿: choseong=ㅎ, jungseong=ㅞ (decomposes: ㅝ+ㅣ → ㅜ+ㅓ+ㅣ), jongseong=ㄳ (→ ㄱ+ㅅ)
    const word = createWord("훿");
    expect(word).not.toBeNull();
    expect(derivePool(word!)).toEqual(["ㅎ", "ㅜ", "ㅓ", "ㅣ", "ㄱ", "ㅅ"]);
  });
});

describe("normalizePool", () => {
  it("rotates each jamo to the 0-index of its rotation set", () => {
    // ㄴ→ㄱ (set: [ㄱ,ㄴ]), ㅓ→ㅏ (set: [ㅏ,ㅜ,ㅓ,ㅗ])
    expect(normalizePool(["ㄴ", "ㅓ"])).toEqual(["ㄱ", "ㅏ"]);
  });

  it("leaves non-rotatable jamo unchanged", () => {
    expect(normalizePool(["ㅎ", "ㄷ"])).toEqual(["ㅎ", "ㄷ"]);
  });

  it("leaves already-canonical jamo unchanged", () => {
    // ㄱ is already index 0 in [ㄱ,ㄴ]; ㅏ is already index 0 in [ㅏ,ㅜ,ㅓ,ㅗ]
    expect(normalizePool(["ㄱ", "ㅏ"])).toEqual(["ㄱ", "ㅏ"]);
  });

  it("normalizes all members of each rotation set to the base", () => {
    // [ㅏ,ㅜ,ㅓ,ㅗ] all → ㅏ
    expect(normalizePool(["ㅏ", "ㅜ", "ㅓ", "ㅗ"])).toEqual(["ㅏ", "ㅏ", "ㅏ", "ㅏ"]);
    // [ㅣ,ㅡ] both → ㅣ
    expect(normalizePool(["ㅣ", "ㅡ"])).toEqual(["ㅣ", "ㅣ"]);
    // [ㅑ,ㅠ,ㅕ,ㅛ] all → ㅑ
    expect(normalizePool(["ㅑ", "ㅠ", "ㅕ", "ㅛ"])).toEqual(["ㅑ", "ㅑ", "ㅑ", "ㅑ"]);
  });
});
