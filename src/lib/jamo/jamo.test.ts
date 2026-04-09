import { describe, it, expect } from "vitest";
import {
  CHOSEONG_INDEX,
  CHOSEONG_BY_INDEX,
  JUNGSEONG_INDEX,
  JUNGSEONG_BY_INDEX,
  JONGSEONG_INDEX,
  JONGSEONG_BY_INDEX,
} from "./jamo";

import { ROTATION_SETS, ROTATION_MAP } from "./rotation";

import { COMBINATION_RULES, COMBINATION_MAP } from "./composition";

describe("CHOSEONG_INDEX", () => {
  it("contains exactly 19 entries", () => {
    expect(Object.keys(CHOSEONG_INDEX).length).toBe(19);
  });

  const EXPECTED_CHOSEONG: [string, number][] = [
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
    expect(CHOSEONG_INDEX[jamo as keyof typeof CHOSEONG_INDEX]).toBe(idx);
    expect(jamo.codePointAt(0)).toBeGreaterThanOrEqual(0x3130);
    expect(jamo.codePointAt(0)).toBeLessThanOrEqual(0x318f);
  });
});

describe("CHOSEONG_BY_INDEX", () => {
  it("reverse-maps 0 to ㄱ and 18 to ㅎ", () => {
    expect(CHOSEONG_BY_INDEX[0]).toBe("ㄱ");
    expect(CHOSEONG_BY_INDEX[18]).toBe("ㅎ");
  });
});

describe("JUNGSEONG_INDEX", () => {
  it("contains exactly 21 entries", () => {
    expect(Object.keys(JUNGSEONG_INDEX).length).toBe(21);
  });

  const EXPECTED_JUNGSEONG: [string, number][] = [
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
    expect(JUNGSEONG_INDEX[jamo as keyof typeof JUNGSEONG_INDEX]).toBe(idx);
    expect(jamo.codePointAt(0)).toBeGreaterThanOrEqual(0x3130);
    expect(jamo.codePointAt(0)).toBeLessThanOrEqual(0x318f);
  });
});

describe("JUNGSEONG_BY_INDEX", () => {
  it("reverse-maps 0 to ㅏ and 20 to ㅣ", () => {
    expect(JUNGSEONG_BY_INDEX[0]).toBe("ㅏ");
    expect(JUNGSEONG_BY_INDEX[20]).toBe("ㅣ");
  });
});

describe("JONGSEONG_INDEX", () => {
  it("contains exactly 28 entries", () => {
    expect(Object.keys(JONGSEONG_INDEX).length).toBe(28);
  });

  const EXPECTED_JONGSEONG: [string, number][] = [
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
      expect(JONGSEONG_INDEX[jamo as keyof typeof JONGSEONG_INDEX]).toBe(idx);
      if (jamo !== "") {
        expect(jamo.codePointAt(0)).toBeGreaterThanOrEqual(0x3130);
        expect(jamo.codePointAt(0)).toBeLessThanOrEqual(0x318f);
      }
    },
  );

  it("does not include ㄸ, ㅃ, or ㅉ", () => {
    expect(JONGSEONG_INDEX["ㄸ" as keyof typeof JONGSEONG_INDEX]).toBeUndefined();
    expect(JONGSEONG_INDEX["ㅃ" as keyof typeof JONGSEONG_INDEX]).toBeUndefined();
    expect(JONGSEONG_INDEX["ㅉ" as keyof typeof JONGSEONG_INDEX]).toBeUndefined();
  });
});

describe("JONGSEONG_BY_INDEX", () => {
  it("reverse-maps 0 to empty string and 27 to ㅎ", () => {
    expect(JONGSEONG_BY_INDEX[0]).toBe("");
    expect(JONGSEONG_BY_INDEX[27]).toBe("ㅎ");
  });
});

describe("ROTATION_SETS", () => {
  it("contains exactly 4 sets", () => {
    expect(ROTATION_SETS.length).toBe(4);
  });

  it("sets are disjoint — no jamo appears in two sets", () => {
    const allJamo: string[] = [];
    for (const set of ROTATION_SETS) {
      for (const jamo of set) {
        allJamo.push(jamo);
      }
    }
    const uniqueJamo = new Set(allJamo);
    expect(uniqueJamo.size).toBe(allJamo.length);
  });

  it("ROTATION_MAP has an entry for every jamo in every set", () => {
    for (const set of ROTATION_SETS) {
      for (const jamo of set) {
        expect(ROTATION_MAP.has(jamo)).toBe(true);
      }
    }
  });

  it("ROTATION_MAP entries do not include the jamo itself", () => {
    for (const set of ROTATION_SETS) {
      for (const jamo of set) {
        const options = ROTATION_MAP.get(jamo);
        expect(options).toBeDefined();
        expect(options).not.toContain(jamo);
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

describe("COMBINATION_RULES", () => {
  it("contains exactly 27 rules", () => {
    expect(COMBINATION_RULES.length).toBe(27);
  });

  it("has exactly 16 DOUBLE_CONSONANT + COMPLEX_VOWEL rules", () => {
    const count = COMBINATION_RULES.filter(
      (r) => r.kind === "DOUBLE_CONSONANT" || r.kind === "COMPLEX_VOWEL",
    ).length;
    expect(count).toBe(16);
  });

  it("has exactly 11 COMPOUND_BATCHIM rules", () => {
    const count = COMBINATION_RULES.filter((r) => r.kind === "COMPOUND_BATCHIM").length;
    expect(count).toBe(11);
  });

  it("has no duplicate input pairs among DOUBLE_CONSONANT and COMPLEX_VOWEL rules", () => {
    const rules = COMBINATION_RULES.filter(
      (r) => r.kind === "DOUBLE_CONSONANT" || r.kind === "COMPLEX_VOWEL",
    );
    const keys = new Set(rules.map((rule) => [rule.inputs[0], rule.inputs[1]].sort().join("|")));
    expect(keys.size).toBe(rules.length);
  });

  it("COMBINATION_MAP has 38 entries (5 double + 22 complex + 11 compound)", () => {
    expect(COMBINATION_MAP.size).toBe(38);
  });

  it("DOUBLE_CONSONANT: COMBINATION_MAP has ㄱ|ㄱ → ㄲ", () => {
    expect(COMBINATION_MAP.get("ㄱ|ㄱ")).toBe("ㄲ");
  });

  it("COMPLEX_VOWEL: COMBINATION_MAP has ㅏ|ㅣ → ㅐ", () => {
    expect(COMBINATION_MAP.get("ㅏ|ㅣ")).toBe("ㅐ");
  });

  it("COMPLEX_VOWEL: COMBINATION_MAP is commutative for ㅗ+ㅏ: both ㅗ|ㅏ and ㅏ|ㅗ resolve to ㅘ", () => {
    expect(COMBINATION_MAP.get("ㅗ|ㅏ")).toBe("ㅘ");
    expect(COMBINATION_MAP.get("ㅏ|ㅗ")).toBe("ㅘ");
  });

  it("COMPOUND_BATCHIM: COMBINATION_MAP has canonical ㄱ|ㅅ → ㄳ", () => {
    expect(COMBINATION_MAP.get("ㄱ|ㅅ")).toBe("ㄳ");
  });

  it("COMPOUND_BATCHIM: COMBINATION_MAP does NOT have reversed ㅅ|ㄱ", () => {
    expect(COMBINATION_MAP.get("ㅅ|ㄱ")).toBeUndefined();
  });
});
