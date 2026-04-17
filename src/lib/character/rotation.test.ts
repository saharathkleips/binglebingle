import { describe, expect, it } from "vitest";
import { character } from ".";
import type { Character } from ".";
import { normalizeCharacter, getNextRotation } from "./rotation";

// ---------------------------------------------------------------------------
// normalizeCharacter()
// ---------------------------------------------------------------------------

describe("normalizeCharacter", () => {
  it.each([
    // Rotatable jamo → normalized to rotation base
    [
      "CHOSEONG_ONLY ㄴ → ㄱ (base of [ㄱ,ㄴ])",
      character({ choseong: "ㄴ" }),
      character({ choseong: "ㄱ" }),
    ],
    [
      "JUNGSEONG_ONLY ㅓ → ㅏ (base of [ㅏ,ㅜ,ㅓ,ㅗ])",
      character({ jungseong: "ㅓ" }),
      character({ jungseong: "ㅏ" }),
    ],
    [
      "JUNGSEONG_ONLY ㅡ → ㅣ (base of [ㅣ,ㅡ])",
      character({ jungseong: "ㅡ" }),
      character({ jungseong: "ㅣ" }),
    ],
    // Already at base → unchanged
    [
      "CHOSEONG_ONLY ㄱ → ㄱ (already base)",
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㄱ" }),
    ],
    [
      "JUNGSEONG_ONLY ㅏ → ㅏ (already base)",
      character({ jungseong: "ㅏ" }),
      character({ jungseong: "ㅏ" }),
    ],
    // JONGSEONG_ONLY — rotatable and non-rotatable
    [
      "JONGSEONG_ONLY ㄴ → ㄱ (base of [ㄱ,ㄴ])",
      character({ jongseong: "ㄴ" }),
      character({ jongseong: "ㄱ" }),
    ],
    [
      "JONGSEONG_ONLY ㄱ → ㄱ (already base)",
      character({ jongseong: "ㄱ" }),
      character({ jongseong: "ㄱ" }),
    ],
    [
      "JONGSEONG_ONLY ㅎ → ㅎ (non-rotatable)",
      character({ jongseong: "ㅎ" }),
      character({ jongseong: "ㅎ" }),
    ],
    // Non-rotatable → unchanged
    [
      "CHOSEONG_ONLY ㅎ → ㅎ (non-rotatable)",
      character({ choseong: "ㅎ" }),
      character({ choseong: "ㅎ" }),
    ],
    // Multi-jamo or EMPTY → unchanged
    [
      "OPEN_SYLLABLE 가 → unchanged (multi-jamo)",
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
    ],
    ["EMPTY → unchanged", character(), character()],
  ] as [string, Character, Character][])("%s", (_, char, expected) => {
    expect(normalizeCharacter(char)).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// getNextRotation()
// ---------------------------------------------------------------------------

describe("getNextRotation", () => {
  it.each([
    // CHOSEONG_ONLY — wraps through rotation set
    ["CHOSEONG_ONLY ㄱ → ㄴ", character({ choseong: "ㄱ" }), character({ choseong: "ㄴ" })],
    ["CHOSEONG_ONLY ㄴ → ㄱ (wrap)", character({ choseong: "ㄴ" }), character({ choseong: "ㄱ" })],
    // JUNGSEONG_ONLY
    ["JUNGSEONG_ONLY ㅏ → ㅜ", character({ jungseong: "ㅏ" }), character({ jungseong: "ㅜ" })],
    [
      "JUNGSEONG_ONLY ㅗ → ㅏ (wrap)",
      character({ jungseong: "ㅗ" }),
      character({ jungseong: "ㅏ" }),
    ],
    // JONGSEONG_ONLY
    ["JONGSEONG_ONLY ㄱ → ㄴ", character({ jongseong: "ㄱ" }), character({ jongseong: "ㄴ" })],
    [
      "JONGSEONG_ONLY ㄴ → ㄱ (wrap)",
      character({ jongseong: "ㄴ" }),
      character({ jongseong: "ㄱ" }),
    ],
  ] as [string, Character, Character][])("returns next rotation: %s", (_, char, expected) => {
    expect(getNextRotation(char)).toEqual(expected);
  });

  it.each([
    // Non-rotatable jamo → null
    ["CHOSEONG_ONLY ㅎ (non-rotatable)", character({ choseong: "ㅎ" })],
    ["JUNGSEONG_ONLY ㅐ (non-rotatable)", character({ jungseong: "ㅐ" })],
    ["JONGSEONG_ONLY ㅎ (non-rotatable)", character({ jongseong: "ㅎ" })],
    // Multi-jamo or EMPTY → null
    ["OPEN_SYLLABLE 가 (multi-jamo)", character({ choseong: "ㄱ", jungseong: "ㅏ" })],
    ["EMPTY", character()],
  ] as [string, Character][])("returns null: %s", (_, char) => {
    expect(getNextRotation(char)).toBeNull();
  });
});
