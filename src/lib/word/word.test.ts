import { describe, expect, it } from "vitest";
import { createWord, derivePool, normalizePool, wordToString } from "./word";
import { character } from "../character/character";

describe("createWord", () => {
  it("returns a Word (CompleteCharacter[]) for a valid Korean syllable block string", () => {
    const word = createWord("한국어");
    expect(word).not.toBeNull();
    expect(word).toHaveLength(3);
    expect(word![0]).toEqual({
      kind: "FULL_SYLLABLE",
      choseong: "ㅎ",
      jungseong: "ㅏ",
      jongseong: "ㄴ",
    });
    expect(word![1]).toEqual({
      kind: "FULL_SYLLABLE",
      choseong: "ㄱ",
      jungseong: "ㅜ",
      jongseong: "ㄱ",
    });
    expect(word![2]).toEqual({ kind: "OPEN_SYLLABLE", choseong: "ㅇ", jungseong: "ㅓ" });
  });

  it("returns null when given an empty string", () => {
    expect(createWord("")).toBeNull();
  });

  it("returns null when any character is a Latin letter", () => {
    expect(createWord("한A")).toBeNull();
  });

  it("returns null when any character is a raw jamo (not a syllable block)", () => {
    expect(createWord("ㄱ")).toBeNull();
  });

  it("returns null for an ASCII digit", () => {
    expect(createWord("한1")).toBeNull();
  });

  it("accepts a single OPEN_SYLLABLE character", () => {
    const word = createWord("가");
    expect(word).toHaveLength(1);
    expect(word![0]).toEqual({ kind: "OPEN_SYLLABLE", choseong: "ㄱ", jungseong: "ㅏ" });
  });

  it("accepts the syllable range boundary 가 (U+AC00)", () => {
    expect(createWord("\uAC00")).not.toBeNull();
  });

  it("accepts the syllable range boundary 힣 (U+D7A3)", () => {
    expect(createWord("\uD7A3")).not.toBeNull();
  });
});

describe("wordToString", () => {
  it("converts a Word back to its original string", () => {
    const word = createWord("한국어");
    expect(wordToString(word!)).toBe("한국어");
  });
});

describe("derivePool", () => {
  it("decomposes 한국어 into the correct flat basic jamo Characters", () => {
    const word = createWord("한국어")!;
    // 한 = ㅎ + ㅏ + ㄴ; 국 = ㄱ + ㅜ + ㄱ; 어 = ㅇ + ㅓ
    expect(derivePool(word)).toEqual([
      character({ choseong: "ㅎ" }),
      character({ jungseong: "ㅏ" }),
      character({ choseong: "ㄴ" }),
      character({ choseong: "ㄱ" }),
      character({ jungseong: "ㅜ" }),
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㅇ" }),
      character({ jungseong: "ㅓ" }),
    ]);
  });

  it("fully decomposes compound jongseong ㄺ in 닭 (ㄷ ㅏ ㄹ ㄱ)", () => {
    const word = createWord("닭")!;
    expect(derivePool(word)).toEqual([
      character({ choseong: "ㄷ" }),
      character({ jungseong: "ㅏ" }),
      character({ choseong: "ㄹ" }),
      character({ choseong: "ㄱ" }),
    ]);
  });

  it("fully decomposes 훿 (complex vowel + compound batchim) → ㅎ ㅜ ㅓ ㅣ ㄱ ㅅ", () => {
    // 훿: choseong=ㅎ, jungseong=ㅞ (→ ㅝ+ㅣ → ㅜ+ㅓ+ㅣ), jongseong=ㄳ (→ ㄱ+ㅅ)
    const word = createWord("훿")!;
    expect(derivePool(word)).toEqual([
      character({ choseong: "ㅎ" }),
      character({ jungseong: "ㅜ" }),
      character({ jungseong: "ㅓ" }),
      character({ jungseong: "ㅣ" }),
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㅅ" }),
    ]);
  });
});

describe("normalizePool", () => {
  it("rotates CHOSEONG_ONLY and JUNGSEONG_ONLY Characters to their rotation base", () => {
    // ㄴ→ㄱ (set: [ㄱ,ㄴ]), ㅓ→ㅏ (set: [ㅏ,ㅜ,ㅓ,ㅗ])
    const pool = [character({ choseong: "ㄴ" })!, character({ jungseong: "ㅓ" })!];
    expect(normalizePool(pool)).toEqual([
      character({ choseong: "ㄱ" }),
      character({ jungseong: "ㅏ" }),
    ]);
  });

  it("leaves non-rotatable jamo Characters unchanged", () => {
    const pool = [character({ choseong: "ㅎ" })!, character({ choseong: "ㄷ" })!];
    expect(normalizePool(pool)).toEqual([
      character({ choseong: "ㅎ" }),
      character({ choseong: "ㄷ" }),
    ]);
  });

  it("leaves already-canonical jamo Characters unchanged", () => {
    const pool = [character({ choseong: "ㄱ" })!, character({ jungseong: "ㅏ" })!];
    expect(normalizePool(pool)).toEqual([
      character({ choseong: "ㄱ" }),
      character({ jungseong: "ㅏ" }),
    ]);
  });

  it("normalizes all members of the vowel-4 set to ㅏ", () => {
    const pool = [
      character({ jungseong: "ㅏ" })!,
      character({ jungseong: "ㅜ" })!,
      character({ jungseong: "ㅓ" })!,
      character({ jungseong: "ㅗ" })!,
    ];
    expect(normalizePool(pool)).toEqual([
      character({ jungseong: "ㅏ" }),
      character({ jungseong: "ㅏ" }),
      character({ jungseong: "ㅏ" }),
      character({ jungseong: "ㅏ" }),
    ]);
  });

  it("normalizes all members of the extended-4 set to ㅑ", () => {
    const pool = [
      character({ jungseong: "ㅑ" })!,
      character({ jungseong: "ㅠ" })!,
      character({ jungseong: "ㅕ" })!,
      character({ jungseong: "ㅛ" })!,
    ];
    expect(normalizePool(pool)).toEqual([
      character({ jungseong: "ㅑ" }),
      character({ jungseong: "ㅑ" }),
      character({ jungseong: "ㅑ" }),
      character({ jungseong: "ㅑ" }),
    ]);
  });
});
