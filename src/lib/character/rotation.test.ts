import { describe, expect, it } from "vitest";
import { character } from ".";
import type { Character } from ".";
import { normalizeCharacter } from "./rotation";

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
