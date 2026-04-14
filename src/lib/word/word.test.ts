import { describe, expect, it } from "vitest";
import { createWord, wordToString } from "./word";

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
