/**
 * @file character.test.ts
 *
 * Tests for combine(), resolveCharacter(), isComplete(), decompose() —
 * the character assembly bridge.
 *
 * Tests written before implementation (TDD red phase).
 */

import { describe, expect, it } from "vitest";
import { combine, decompose, isComplete, resolveCharacter } from "./character";

// ---------------------------------------------------------------------------
// combine()
// ---------------------------------------------------------------------------

describe("combine", () => {
  // Empty target
  it("empty + choseong → { choseong }", () => {
    expect(combine({}, { choseong: "ㄱ" })).toEqual({ choseong: "ㄱ" });
  });

  it("empty + jungseong → { jungseong }", () => {
    expect(combine({}, { jungseong: "ㅏ" })).toEqual({ jungseong: "ㅏ" });
  });

  // Choseong-only target
  it("choseong + choseong (combinable: ㄱ+ㄱ→ㄲ) → { choseong: ㄲ }", () => {
    expect(combine({ choseong: "ㄱ" }, { choseong: "ㄱ" })).toEqual({ choseong: "ㄲ" });
  });

  it("choseong + choseong (combinable: ㄷ+ㄷ→ㄸ) → { choseong: ㄸ }", () => {
    expect(combine({ choseong: "ㄷ" }, { choseong: "ㄷ" })).toEqual({ choseong: "ㄸ" });
  });

  it("choseong + choseong (combinable: ㅂ+ㅂ→ㅃ) → { choseong: ㅃ }", () => {
    expect(combine({ choseong: "ㅂ" }, { choseong: "ㅂ" })).toEqual({ choseong: "ㅃ" });
  });

  it("choseong + choseong (combinable: ㅅ+ㅅ→ㅆ) → { choseong: ㅆ }", () => {
    expect(combine({ choseong: "ㅅ" }, { choseong: "ㅅ" })).toEqual({ choseong: "ㅆ" });
  });

  it("choseong + choseong (combinable: ㅈ+ㅈ→ㅉ) → { choseong: ㅉ }", () => {
    expect(combine({ choseong: "ㅈ" }, { choseong: "ㅈ" })).toEqual({ choseong: "ㅉ" });
  });

  it("choseong + choseong (not combinable: ㄱ+ㄴ) → null", () => {
    expect(combine({ choseong: "ㄱ" }, { choseong: "ㄴ" })).toBeNull();
  });

  it("choseong + jungseong → { choseong, jungseong }", () => {
    expect(combine({ choseong: "ㄱ" }, { jungseong: "ㅏ" })).toEqual({
      choseong: "ㄱ",
      jungseong: "ㅏ",
    });
  });

  // Jungseong-only target
  it("jungseong + jungseong (combinable: ㅗ+ㅏ→ㅘ) → { jungseong: ㅘ }", () => {
    expect(combine({ jungseong: "ㅗ" }, { jungseong: "ㅏ" })).toEqual({ jungseong: "ㅘ" });
  });

  it("jungseong + jungseong (combinable: ㅜ+ㅓ→ㅝ) → { jungseong: ㅝ }", () => {
    expect(combine({ jungseong: "ㅜ" }, { jungseong: "ㅓ" })).toEqual({ jungseong: "ㅝ" });
  });

  it("jungseong + jungseong (combinable: ㅡ+ㅣ→ㅢ) → { jungseong: ㅢ }", () => {
    expect(combine({ jungseong: "ㅡ" }, { jungseong: "ㅣ" })).toEqual({ jungseong: "ㅢ" });
  });

  it("jungseong + jungseong (not combinable: ㅏ+ㅏ) → null", () => {
    expect(combine({ jungseong: "ㅏ" }, { jungseong: "ㅏ" })).toBeNull();
  });

  it("jungseong + choseong → { choseong: incoming, jungseong }", () => {
    expect(combine({ jungseong: "ㅏ" }, { choseong: "ㄱ" })).toEqual({
      choseong: "ㄱ",
      jungseong: "ㅏ",
    });
  });

  // Choseong + jungseong target
  it("choseong+jungseong + jungseong (combinable vowel: ㅗ+ㅏ→ㅘ) → updated jungseong", () => {
    expect(combine({ choseong: "ㅎ", jungseong: "ㅗ" }, { jungseong: "ㅏ" })).toEqual({
      choseong: "ㅎ",
      jungseong: "ㅘ",
    });
  });

  it("choseong+jungseong + jungseong (not combinable: ㅏ+ㅏ) → null", () => {
    expect(combine({ choseong: "ㄱ", jungseong: "ㅏ" }, { jungseong: "ㅏ" })).toBeNull();
  });

  it("choseong+jungseong + choseong → full syllable Character", () => {
    expect(combine({ choseong: "ㄱ", jungseong: "ㅏ" }, { choseong: "ㄴ" })).toEqual({
      choseong: "ㄱ",
      jungseong: "ㅏ",
      jongseong: "ㄴ",
    });
  });

  // Full (choseong+jungseong+jongseong) target
  it("full + choseong (upgradeable jongseong: ㄱ+ㅅ→ㄳ) → updated jongseong", () => {
    expect(
      combine({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄱ" }, { choseong: "ㅅ" }),
    ).toEqual({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄳ" });
  });

  it("full + choseong (upgradeable jongseong: ㄹ+ㄱ→ㄺ) → updated jongseong", () => {
    expect(
      combine({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" }, { choseong: "ㄱ" }),
    ).toEqual({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄺ" });
  });

  it("full + choseong (no upgrade rule: ㄱ+ㄱ) → null", () => {
    expect(
      combine({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄱ" }, { choseong: "ㄱ" }),
    ).toBeNull();
  });

  it("full + jungseong → null (no 4-part syllables)", () => {
    expect(
      combine({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" }, { jungseong: "ㅏ" }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveCharacter()
// ---------------------------------------------------------------------------

describe("resolveCharacter", () => {
  it("empty {} → null", () => {
    expect(resolveCharacter({})).toBeNull();
  });

  it("{ choseong: 'ㄱ' } → 'ㄱ'", () => {
    expect(resolveCharacter({ choseong: "ㄱ" })).toBe("ㄱ");
  });

  it("{ jungseong: 'ㅏ' } → 'ㅏ'", () => {
    expect(resolveCharacter({ jungseong: "ㅏ" })).toBe("ㅏ");
  });

  it("{ choseong: 'ㄱ', jungseong: 'ㅏ' } → '가'", () => {
    expect(resolveCharacter({ choseong: "ㄱ", jungseong: "ㅏ" })).toBe("가");
  });

  it("{ choseong: 'ㅎ', jungseong: 'ㅏ', jongseong: 'ㄴ' } → '한'", () => {
    expect(resolveCharacter({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" })).toBe("한");
  });

  it("{ choseong: 'ㅎ', jungseong: 'ㅞ', jongseong: 'ㄳ' } → '훿'", () => {
    expect(resolveCharacter({ choseong: "ㅎ", jungseong: "ㅞ", jongseong: "ㄳ" })).toBe("훿");
  });

  it("invalid combo (choseong 'ㄱ' + jungseong 'ㄱ') → null", () => {
    // 'ㄱ' is not a valid jungseong — composeSyllable returns null
    expect(resolveCharacter({ choseong: "ㄱ", jungseong: "ㄱ" })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isComplete()
// ---------------------------------------------------------------------------

describe("isComplete", () => {
  it("{ choseong: 'ㄱ', jungseong: 'ㅏ' } → true", () => {
    expect(isComplete({ choseong: "ㄱ", jungseong: "ㅏ" })).toBe(true);
  });

  it("{ choseong: 'ㅎ', jungseong: 'ㅏ', jongseong: 'ㄴ' } → true", () => {
    expect(isComplete({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" })).toBe(true);
  });

  it("{ choseong: 'ㄱ' } → false", () => {
    expect(isComplete({ choseong: "ㄱ" })).toBe(false);
  });

  it("{ jungseong: 'ㅏ' } → false (jungseong-only is not a syllable block)", () => {
    expect(isComplete({ jungseong: "ㅏ" })).toBe(false);
  });

  it("{} → false", () => {
    expect(isComplete({})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// decompose()
// ---------------------------------------------------------------------------

describe("decompose", () => {
  it("full syllable with simple jongseong → [{ choseong, jungseong }]", () => {
    expect(decompose({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" })).toEqual([
      { choseong: "ㄱ", jungseong: "ㅏ" },
    ]);
  });

  it("full syllable with compound batchim ㄳ → [choseong+jungseong, {choseong:'ㄱ'}, {choseong:'ㅅ'}]", () => {
    expect(decompose({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄳ" })).toEqual([
      { choseong: "ㅎ", jungseong: "ㅏ" },
      { choseong: "ㄱ" },
      { choseong: "ㅅ" },
    ]);
  });

  it("full syllable with compound batchim ㄺ → [choseong+jungseong, {choseong:'ㄹ'}, {choseong:'ㄱ'}]", () => {
    expect(decompose({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄺ" })).toEqual([
      { choseong: "ㄱ", jungseong: "ㅏ" },
      { choseong: "ㄹ" },
      { choseong: "ㄱ" },
    ]);
  });

  it("choseong+jungseong → [{ choseong }]", () => {
    expect(decompose({ choseong: "ㄱ", jungseong: "ㅏ" })).toEqual([{ choseong: "ㄱ" }]);
  });

  it("choseong only → []", () => {
    expect(decompose({ choseong: "ㄱ" })).toEqual([]);
  });

  it("empty → []", () => {
    expect(decompose({})).toEqual([]);
  });
});
