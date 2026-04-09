import { describe, it, expect } from "vitest";
import {
  CHOSEONG_INDEX,
  CHOSEONG_BY_INDEX,
  JUNGSEONG_INDEX,
  JUNGSEONG_BY_INDEX,
  JONGSEONG_INDEX,
  JONGSEONG_BY_INDEX,
  type ChoseongJamo,
  type JongseongJamo,
  type VowelJamo,
} from "./jamo";

describe("CHOSEONG_INDEX", () => {
  it("contains exactly 19 entries", () => {
    expect(Object.keys(CHOSEONG_INDEX).length).toBe(19);
  });

  const EXPECTED_CHOSEONG: [ChoseongJamo, number][] = [
    ["ㄱ", 0],
    ["ㄲ", 1],
    ["ㄴ", 2],
    ["ㄷ", 3],
    ["ㄸ", 4],
    ["ㄹ", 5],
    ["ㅁ", 6],
    ["ㅂ", 7],
    ["ㅃ", 8],
    ["ㅅ", 9],
    ["ㅆ", 10],
    ["ㅇ", 11],
    ["ㅈ", 12],
    ["ㅉ", 13],
    ["ㅊ", 14],
    ["ㅋ", 15],
    ["ㅌ", 16],
    ["ㅍ", 17],
    ["ㅎ", 18],
  ];

  it.each(EXPECTED_CHOSEONG)("maps %s to %i and uses Compatibility Jamo codepoint", (jamo, idx) => {
    expect(CHOSEONG_INDEX[jamo]).toBe(idx);
    expect(jamo.codePointAt(0)).toBeGreaterThanOrEqual(0x3130);
    expect(jamo.codePointAt(0)).toBeLessThanOrEqual(0x318f);
  });

  it("reverse map is correct for all entries", () => {
    for (const [jamo, idx] of EXPECTED_CHOSEONG) {
      expect(CHOSEONG_BY_INDEX[idx]).toBe(jamo);
    }
  });
});

describe("JUNGSEONG_INDEX", () => {
  it("contains exactly 21 entries", () => {
    expect(Object.keys(JUNGSEONG_INDEX).length).toBe(21);
  });

  const EXPECTED_JUNGSEONG: [VowelJamo, number][] = [
    ["ㅏ", 0],
    ["ㅐ", 1],
    ["ㅑ", 2],
    ["ㅒ", 3],
    ["ㅓ", 4],
    ["ㅔ", 5],
    ["ㅕ", 6],
    ["ㅖ", 7],
    ["ㅗ", 8],
    ["ㅘ", 9],
    ["ㅙ", 10],
    ["ㅚ", 11],
    ["ㅛ", 12],
    ["ㅜ", 13],
    ["ㅝ", 14],
    ["ㅞ", 15],
    ["ㅟ", 16],
    ["ㅠ", 17],
    ["ㅡ", 18],
    ["ㅢ", 19],
    ["ㅣ", 20],
  ];

  it.each(EXPECTED_JUNGSEONG)("maps %s to %i and uses Compatibility Jamo codepoint", (jamo, idx) => {
    expect(JUNGSEONG_INDEX[jamo]).toBe(idx);
    expect(jamo.codePointAt(0)).toBeGreaterThanOrEqual(0x3130);
    expect(jamo.codePointAt(0)).toBeLessThanOrEqual(0x318f);
  });

  it("reverse map is correct for all entries", () => {
    for (const [jamo, idx] of EXPECTED_JUNGSEONG) {
      expect(JUNGSEONG_BY_INDEX[idx]).toBe(jamo);
    }
  });
});

describe("JONGSEONG_INDEX", () => {
  it("contains exactly 28 entries", () => {
    expect(Object.keys(JONGSEONG_INDEX).length).toBe(28);
  });

  const EXPECTED_JONGSEONG: [JongseongJamo | "", number][] = [
    ["", 0],
    ["ㄱ", 1],
    ["ㄲ", 2],
    ["ㄳ", 3],
    ["ㄴ", 4],
    ["ㄵ", 5],
    ["ㄶ", 6],
    ["ㄷ", 7],
    ["ㄹ", 8],
    ["ㄺ", 9],
    ["ㄻ", 10],
    ["ㄼ", 11],
    ["ㄽ", 12],
    ["ㄾ", 13],
    ["ㄿ", 14],
    ["ㅀ", 15],
    ["ㅁ", 16],
    ["ㅂ", 17],
    ["ㅄ", 18],
    ["ㅅ", 19],
    ["ㅆ", 20],
    ["ㅇ", 21],
    ["ㅈ", 22],
    ["ㅊ", 23],
    ["ㅋ", 24],
    ["ㅌ", 25],
    ["ㅍ", 26],
    ["ㅎ", 27],
  ];

  it.each(EXPECTED_JONGSEONG)(
    "maps %s to %i (and non-empty keys use Compatibility Jamo codepoint)",
    (jamo, idx) => {
      expect(JONGSEONG_INDEX[jamo]).toBe(idx);
      if (jamo !== "") {
        expect(jamo.codePointAt(0)).toBeGreaterThanOrEqual(0x3130);
        expect(jamo.codePointAt(0)).toBeLessThanOrEqual(0x318f);
      }
    },
  );

  it("does not include ㄸ, ㅃ, or ㅉ", () => {
    // Use 'as any' to check for invalid keys — these are intentionally excluded
    expect((JONGSEONG_INDEX as any)["ㄸ"]).toBeUndefined();
    expect((JONGSEONG_INDEX as any)["ㅃ"]).toBeUndefined();
    expect((JONGSEONG_INDEX as any)["ㅉ"]).toBeUndefined();
  });

  it("reverse map is correct for all entries", () => {
    for (const [jamo, idx] of EXPECTED_JONGSEONG) {
      expect(JONGSEONG_BY_INDEX[idx]).toBe(jamo);
    }
  });
});
