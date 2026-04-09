import { describe, expect, it } from "vitest";

import type { Jamo } from "./jamo";
import { getNextRotation, ROTATION_SETS } from "./rotation";

describe("ROTATION_SETS", () => {
  it("contains exactly 4 sets", () => {
    expect(ROTATION_SETS.length).toBe(4);
  });

  it("sets are disjoint — no jamo appears in two sets", () => {
    const allJamo: Jamo[] = [];
    for (const set of ROTATION_SETS) {
      for (const jamo of set) {
        allJamo.push(jamo);
      }
    }
    const uniqueJamo = new Set(allJamo);
    expect(uniqueJamo.size).toBe(allJamo.length);
  });

  it("every jamo in every set is rotatable (getNextRotation returns non-null)", () => {
    for (const set of ROTATION_SETS) {
      for (const jamo of set) {
        expect(getNextRotation(jamo)).not.toBeNull();
      }
    }
  });

  it("getNextRotation never returns the input jamo itself", () => {
    for (const set of ROTATION_SETS) {
      for (const jamo of set) {
        expect(getNextRotation(jamo)).not.toBe(jamo);
      }
    }
  });

  it("vowel set 1 uses clockwise order: ㅏ, ㅜ, ㅓ, ㅗ", () => {
    expect(ROTATION_SETS[1]).toStrictEqual(["ㅏ", "ㅜ", "ㅓ", "ㅗ"]);
  });

  it("vowel set 2 uses clockwise order: ㅑ, ㅠ, ㅕ, ㅛ", () => {
    expect(ROTATION_SETS[3]).toStrictEqual(["ㅑ", "ㅠ", "ㅕ", "ㅛ"]);
  });
});

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
