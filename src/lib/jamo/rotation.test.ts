import { describe, expect, it } from "vitest";

import type { Jamo } from "./jamo";
import { getNextRotation, getRotationBase } from "./rotation";

describe("getNextRotation", () => {
  const ROTATABLE_CASES: [string, Jamo, Jamo][] = [
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
    ["ㅠ→ㅕ (index 1→2 in extended 4-set)", "ㅠ", "ㅕ"],
    ["ㅕ→ㅛ (index 2→3 in extended 4-set)", "ㅕ", "ㅛ"],
    ["ㅛ→ㅑ (wrap-around in extended 4-set)", "ㅛ", "ㅑ"],
  ];

  it.each(ROTATABLE_CASES)("%s", (_desc, input, expected) => {
    expect(getNextRotation(input)).toBe(expected);
  });

  const NON_ROTATABLE: Jamo[] = ["ㅎ", "ㅊ", "ㅂ", "ㄷ", "ㅁ"];

  it.each(NON_ROTATABLE)("returns null for non-rotatable jamo %s", (jamo) => {
    expect(getNextRotation(jamo)).toBeNull();
  });
});

describe("getRotationBase", () => {
  const BASE_CASES: [string, Jamo, Jamo][] = [
    ["ㄱ is already the base of [ㄱ,ㄴ]", "ㄱ", "ㄱ"],
    ["ㄴ normalizes to ㄱ", "ㄴ", "ㄱ"],
    ["ㅏ is already the base of [ㅏ,ㅜ,ㅓ,ㅗ]", "ㅏ", "ㅏ"],
    ["ㅜ normalizes to ㅏ", "ㅜ", "ㅏ"],
    ["ㅓ normalizes to ㅏ", "ㅓ", "ㅏ"],
    ["ㅗ normalizes to ㅏ", "ㅗ", "ㅏ"],
    ["ㅣ is already the base of [ㅣ,ㅡ]", "ㅣ", "ㅣ"],
    ["ㅡ normalizes to ㅣ", "ㅡ", "ㅣ"],
    ["ㅑ is already the base of [ㅑ,ㅠ,ㅕ,ㅛ]", "ㅑ", "ㅑ"],
    ["ㅠ normalizes to ㅑ", "ㅠ", "ㅑ"],
    ["ㅕ normalizes to ㅑ", "ㅕ", "ㅑ"],
    ["ㅛ normalizes to ㅑ", "ㅛ", "ㅑ"],
  ];

  it.each(BASE_CASES)("%s", (_desc, input, expected) => {
    expect(getRotationBase(input)).toBe(expected);
  });

  const NON_ROTATABLE_BASE: Jamo[] = ["ㅎ", "ㅊ", "ㅂ", "ㄷ", "ㅁ"];

  it.each(NON_ROTATABLE_BASE)("returns %s unchanged when not rotatable", (jamo) => {
    expect(getRotationBase(jamo)).toBe(jamo);
  });
});
