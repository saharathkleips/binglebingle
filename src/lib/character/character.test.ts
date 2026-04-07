/**
 * @file character.test.ts
 *
 * Tests for resolveCharacter() and isComplete() — the character assembly bridge.
 */

import { describe, expect, it } from "vitest";
import { isComplete, resolveCharacter } from "./character";

describe("resolveCharacter", () => {
  it("returns null for empty jamo list", () => {
    expect(resolveCharacter({ jamo: [] })).toBeNull();
  });

  it("returns the single jamo as-is for length-1 list", () => {
    expect(resolveCharacter({ jamo: ["ㄱ"] })).toBe("ㄱ");
  });

  it("returns an already-combined jamo as-is for length-1 list", () => {
    expect(resolveCharacter({ jamo: ["ㅐ"] })).toBe("ㅐ");
  });

  it("returns combined jamo for a combinable pair", () => {
    // ㅏ + ㅣ → ㅐ (complex vowel)
    expect(resolveCharacter({ jamo: ["ㅏ", "ㅣ"] })).toBe("ㅐ");
    // ㄱ + ㄱ → ㄲ (double consonant)
    expect(resolveCharacter({ jamo: ["ㄱ", "ㄱ"] })).toBe("ㄲ");
  });

  it("returns syllable when pair is consonant+vowel with no combination rule", () => {
    expect(resolveCharacter({ jamo: ["ㄱ", "ㅏ"] })).toBe("가");
  });

  it("returns syllable with combined vowel in jungseong", () => {
    expect(resolveCharacter({ jamo: ["ㅎ", "ㅐ"] })).toBe("해");
  });

  it("returns null for two jamo with no combination rule and not a valid syllable", () => {
    expect(resolveCharacter({ jamo: ["ㄱ", "ㅎ"] })).toBeNull();
  });

  it("returns syllable for three-jamo list with jongseong", () => {
    expect(resolveCharacter({ jamo: ["ㅎ", "ㅏ", "ㄴ"] })).toBe("한");
  });

  it("returns 훿 for [ㅎ, ㅞ, ㄳ] (complex vowel + compound batchim, already collapsed)", () => {
    expect(resolveCharacter({ jamo: ["ㅎ", "ㅞ", "ㄳ"] })).toBe("훿");
  });

  it("returns null for three-jamo list that is not a valid syllable", () => {
    // ㄱ is not a valid jungseong, ㄴ is not a valid jungseong
    expect(resolveCharacter({ jamo: ["ㄱ", "ㄴ", "ㄱ"] })).toBeNull();
  });
});

describe("isComplete", () => {
  it("returns true when jamo resolve to a syllable block", () => {
    expect(isComplete({ jamo: ["ㄱ", "ㅏ"] })).toBe(true);
    expect(isComplete({ jamo: ["ㅎ", "ㅏ", "ㄴ"] })).toBe(true);
  });

  it("returns false when jamo resolve to a bare jamo (not a syllable block)", () => {
    // ㅏ + ㅣ → ㅐ, which is a jamo not a syllable block
    expect(isComplete({ jamo: ["ㅏ", "ㅣ"] })).toBe(false);
    expect(isComplete({ jamo: ["ㄱ"] })).toBe(false);
  });

  it("returns false for empty jamo list", () => {
    expect(isComplete({ jamo: [] })).toBe(false);
  });

  it("returns false when jamo do not resolve (null result)", () => {
    expect(isComplete({ jamo: ["ㄱ", "ㅎ"] })).toBe(false);
  });
});
