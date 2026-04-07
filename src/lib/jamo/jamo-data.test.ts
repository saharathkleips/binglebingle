import { describe, it, expect } from "vitest";
import {
  CHOSEONG_INDEX,
  JUNGSEONG_INDEX,
  JONGSEONG_INDEX,
  ROTATION_SETS,
  ROTATION_MAP,
  COMBINATION_RULES,
  COMBINATION_MAP,
  JONGSEONG_UPGRADE_RULES,
  JONGSEONG_UPGRADE_MAP,
} from "./jamo-data";

describe("CHOSEONG_INDEX", () => {
  it("contains exactly 19 entries", () => {
    expect(Object.keys(CHOSEONG_INDEX).length).toBe(19);
  });

  it("maps ㄱ to 0 and ㅎ to 18", () => {
    expect(CHOSEONG_INDEX["ㄱ"]).toBe(0);
    expect(CHOSEONG_INDEX["ㅎ"]).toBe(18);
  });

  it("all keys use Hangul Compatibility Jamo codepoints (0x3130–0x318F)", () => {
    for (const key of Object.keys(CHOSEONG_INDEX)) {
      const cp = key.codePointAt(0);
      expect(cp).toBeGreaterThanOrEqual(0x3130);
      expect(cp).toBeLessThanOrEqual(0x318f);
    }
  });
});

describe("JUNGSEONG_INDEX", () => {
  it("contains exactly 21 entries", () => {
    expect(Object.keys(JUNGSEONG_INDEX).length).toBe(21);
  });

  it("maps ㅏ to 0 and ㅣ to 20", () => {
    expect(JUNGSEONG_INDEX["ㅏ"]).toBe(0);
    expect(JUNGSEONG_INDEX["ㅣ"]).toBe(20);
  });

  it("all keys use Hangul Compatibility Jamo codepoints (0x3130–0x318F)", () => {
    for (const key of Object.keys(JUNGSEONG_INDEX)) {
      const cp = key.codePointAt(0);
      expect(cp).toBeGreaterThanOrEqual(0x3130);
      expect(cp).toBeLessThanOrEqual(0x318f);
    }
  });
});

describe("JONGSEONG_INDEX", () => {
  it("contains exactly 28 entries", () => {
    expect(Object.keys(JONGSEONG_INDEX).length).toBe(28);
  });

  it("maps the empty string to 0", () => {
    expect(JONGSEONG_INDEX[""]).toBe(0);
  });

  it("does not include ㄸ, ㅃ, or ㅉ", () => {
    expect(JONGSEONG_INDEX["ㄸ"]).toBeUndefined();
    expect(JONGSEONG_INDEX["ㅃ"]).toBeUndefined();
    expect(JONGSEONG_INDEX["ㅉ"]).toBeUndefined();
  });

  it("all non-empty keys use Hangul Compatibility Jamo codepoints (0x3130–0x318F)", () => {
    for (const key of Object.keys(JONGSEONG_INDEX)) {
      if (key === "") continue;
      const cp = key.codePointAt(0);
      expect(cp).toBeGreaterThanOrEqual(0x3130);
      expect(cp).toBeLessThanOrEqual(0x318f);
    }
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
});

describe("COMBINATION_RULES", () => {
  it("contains exactly 16 rules", () => {
    expect(COMBINATION_RULES.length).toBe(16);
  });

  it("has no duplicate input pairs", () => {
    const keys = new Set(
      COMBINATION_RULES.map((rule) => [rule.inputs[0], rule.inputs[1]].sort().join("|")),
    );
    expect(keys.size).toBe(COMBINATION_RULES.length);
  });

  it("COMBINATION_MAP lookup returns correct output for ㅏ+ㅣ → ㅐ", () => {
    const key = ["ㅏ", "ㅣ"].sort().join("|");
    expect(COMBINATION_MAP.get(key)?.output).toBe("ㅐ");
  });

  it("COMBINATION_MAP lookup is commutative: ㅗ+ㅏ and ㅏ+ㅗ both resolve", () => {
    const key1 = ["ㅗ", "ㅏ"].sort().join("|");
    const key2 = ["ㅏ", "ㅗ"].sort().join("|");
    expect(key1).toBe(key2);
    expect(COMBINATION_MAP.get(key1)?.output).toBe("ㅘ");
  });
});

describe("JONGSEONG_UPGRADE_RULES", () => {
  it("contains exactly 11 rules", () => {
    expect(JONGSEONG_UPGRADE_RULES.length).toBe(11);
  });

  it("JONGSEONG_UPGRADE_MAP lookup returns ㄳ for ㄱ|ㅅ key", () => {
    expect(JONGSEONG_UPGRADE_MAP.get("ㄱ|ㅅ")).toBe("ㄳ");
  });

  it("JONGSEONG_UPGRADE_MAP does NOT contain reversed key ㅅ|ㄱ", () => {
    expect(JONGSEONG_UPGRADE_MAP.get("ㅅ|ㄱ")).toBeUndefined();
  });
});
