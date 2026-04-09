import { describe, expect, it } from "vitest";

import type { Jamo } from "./types";
import { getNextRotation } from "./rotation";

describe("getNextRotation", () => {
  const ROTATABLE_CASES: [string, string, string][] = [
    // [description, input, expected]
    ["ㄱ→ㄴ (consonant set)", "ㄱ", "ㄴ"],
    ["ㄴ→ㄱ (wrap-around in 2-set)", "ㄴ", "ㄱ"],
    ["ㅏ→ㅜ (first of 4-set, clockwise)", "ㅏ", "ㅜ"],
    ["ㅜ→ㅓ (index 1→2 in clockwise set)", "ㅜ", "ㅓ"],
    ["ㅓ→ㅗ (index 2→3)", "ㅓ", "ㅗ"],
    ["ㅗ→ㅏ (wrap-around in 4-set)", "ㅗ", "ㅏ"],
    ["ㅣ→ㅡ (first of 2-set)", "ㅣ", "ㅡ"],
    ["ㅡ→ㅣ (wrap-around in 2-set)", "ㅡ", "ㅣ"],
    ["ㅑ→ㅠ (first of extended 4-set)", "ㅑ", "ㅠ"],
    ["ㅛ→ㅑ (wrap-around in extended 4-set)", "ㅛ", "ㅑ"],
  ];

  it.each(ROTATABLE_CASES)("%s", (_desc, input, expected) => {
    expect(getNextRotation(input as Jamo)).toBe(expected);
  });

  const NON_ROTATABLE: string[] = ["ㅎ", "ㅊ", "ㅂ", "ㄷ", "ㅁ"];

  it.each(NON_ROTATABLE)("returns null for non-rotatable jamo %s", (jamo) => {
    expect(getNextRotation(jamo as Jamo)).toBeNull();
  });
});
