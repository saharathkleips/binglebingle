import { describe, expect, it } from "vitest";
import { character, resolveCharacter } from ".";
import type { Character } from ".";
import { compose, decompose, fullDecompose } from "./composition";

// ---------------------------------------------------------------------------
// compose()
// ---------------------------------------------------------------------------

describe("compose", () => {
  it.each([
    // --- Empty target: absorbs incoming as-is, including multi-slot ---
    ["empty + choseong", character(), character({ choseong: "ㄱ" }), character({ choseong: "ㄱ" })],
    [
      "empty + jungseong",
      character(),
      character({ jungseong: "ㅏ" }),
      character({ jungseong: "ㅏ" }),
    ],
    [
      "empty + simple jongseong",
      character(),
      character({ jongseong: "ㄱ" }),
      character({ jongseong: "ㄱ" }),
    ],
    [
      "empty + compound jongseong",
      character(),
      character({ jongseong: "ㄳ" }),
      character({ jongseong: "ㄳ" }),
    ],
    [
      "empty + open syllable 가 (cho+jung)",
      character(),
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
    ],
    [
      "empty + full syllable 한 (cho+jung+jong)",
      character(),
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" }),
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" }),
    ],

    // --- Both multi-slot → always null (both sides would drop jamo) ---
    [
      "open syllable 가 + open syllable 해 (cho+jung) → null",
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
      character({ choseong: "ㅎ", jungseong: "ㅐ" }),
      null,
    ],
    [
      "open syllable 고 + open syllable 아 — would yield valid vowel combo but both are multi-slot → null",
      character({ choseong: "ㄱ", jungseong: "ㅗ" }),
      character({ choseong: "ㅇ", jungseong: "ㅏ" }),
      null,
    ],
    [
      "open syllable 가 + full syllable 한 (cho+jung+jong) → null",
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" }),
      null,
    ],
    [
      "full syllable 간 + open syllable 가 (cho+jung) → null",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
      null,
    ],
    [
      "full syllable 간 + full syllable 한 (cho+jung+jong) → null",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" }),
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" }),
      null,
    ],

    // --- Choseong-only + open syllable: consonant becomes jongseong of incoming ---
    [
      "cho(ㄱ) + open syllable 가 → 각 (ㄱ becomes jongseong)",
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄱ" }),
    ],
    [
      "cho(ㄱ) + open syllable 하 → 학",
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㅎ", jungseong: "ㅏ" }),
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄱ" }),
    ],
    [
      "cho(ㄸ) + open syllable 하 → null (ㄸ not valid jongseong)",
      character({ choseong: "ㄸ" }),
      character({ choseong: "ㅎ", jungseong: "ㅏ" }),
      null,
    ],

    // --- Choseong-only + full syllable: consonant extends incoming's jongseong ---
    [
      "cho(ㅅ) + full syllable 학 → 핛 (ㄱ+ㅅ=ㄳ compound batchim)",
      character({ choseong: "ㅅ" }),
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄱ" }),
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄳ" }),
    ],
    [
      "cho(ㄱ) + full syllable 학 → ㄱ+ㄱ=ㄲ jongseong",
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄱ" }),
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄲ" }),
    ],
    [
      "cho(ㄴ) + full syllable 학 → null (no rule for ㄱ+ㄴ)",
      character({ choseong: "ㄴ" }),
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄱ" }),
      null,
    ],

    // --- Choseong-only: double consonant → choseong ---
    [
      "cho(ㄱ)+cho(ㄱ) → ㄲ",
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㄲ" }),
    ],
    [
      "cho(ㄷ)+cho(ㄷ) → ㄸ",
      character({ choseong: "ㄷ" }),
      character({ choseong: "ㄷ" }),
      character({ choseong: "ㄸ" }),
    ],
    [
      "cho(ㅂ)+cho(ㅂ) → ㅃ",
      character({ choseong: "ㅂ" }),
      character({ choseong: "ㅂ" }),
      character({ choseong: "ㅃ" }),
    ],
    [
      "cho(ㅅ)+cho(ㅅ) → ㅆ",
      character({ choseong: "ㅅ" }),
      character({ choseong: "ㅅ" }),
      character({ choseong: "ㅆ" }),
    ],
    [
      "cho(ㅈ)+cho(ㅈ) → ㅉ",
      character({ choseong: "ㅈ" }),
      character({ choseong: "ㅈ" }),
      character({ choseong: "ㅉ" }),
    ],

    // --- Choseong-only: compound batchim → jongseong-only ---
    [
      "cho(ㄱ)+cho(ㅅ) → jong(ㄳ)",
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㅅ" }),
      character({ jongseong: "ㄳ" }),
    ],
    [
      "cho(ㄴ)+cho(ㅈ) → jong(ㄵ)",
      character({ choseong: "ㄴ" }),
      character({ choseong: "ㅈ" }),
      character({ jongseong: "ㄵ" }),
    ],
    [
      "cho(ㄴ)+cho(ㅎ) → jong(ㄶ)",
      character({ choseong: "ㄴ" }),
      character({ choseong: "ㅎ" }),
      character({ jongseong: "ㄶ" }),
    ],
    [
      "cho(ㄹ)+cho(ㄱ) → jong(ㄺ)",
      character({ choseong: "ㄹ" }),
      character({ choseong: "ㄱ" }),
      character({ jongseong: "ㄺ" }),
    ],
    [
      "cho(ㄹ)+cho(ㅁ) → jong(ㄻ)",
      character({ choseong: "ㄹ" }),
      character({ choseong: "ㅁ" }),
      character({ jongseong: "ㄻ" }),
    ],
    [
      "cho(ㄹ)+cho(ㅂ) → jong(ㄼ)",
      character({ choseong: "ㄹ" }),
      character({ choseong: "ㅂ" }),
      character({ jongseong: "ㄼ" }),
    ],
    [
      "cho(ㄹ)+cho(ㅅ) → jong(ㄽ)",
      character({ choseong: "ㄹ" }),
      character({ choseong: "ㅅ" }),
      character({ jongseong: "ㄽ" }),
    ],
    [
      "cho(ㄹ)+cho(ㅌ) → jong(ㄾ)",
      character({ choseong: "ㄹ" }),
      character({ choseong: "ㅌ" }),
      character({ jongseong: "ㄾ" }),
    ],
    [
      "cho(ㄹ)+cho(ㅍ) → jong(ㄿ)",
      character({ choseong: "ㄹ" }),
      character({ choseong: "ㅍ" }),
      character({ jongseong: "ㄿ" }),
    ],
    [
      "cho(ㄹ)+cho(ㅎ) → jong(ㅀ)",
      character({ choseong: "ㄹ" }),
      character({ choseong: "ㅎ" }),
      character({ jongseong: "ㅀ" }),
    ],
    [
      "cho(ㅂ)+cho(ㅅ) → jong(ㅄ)",
      character({ choseong: "ㅂ" }),
      character({ choseong: "ㅅ" }),
      character({ jongseong: "ㅄ" }),
    ],

    // --- Choseong-only: other ---
    [
      "cho(ㄱ)+jung(ㅏ) → open syllable",
      character({ choseong: "ㄱ" }),
      character({ jungseong: "ㅏ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
    ],
    [
      "cho(ㄱ)+cho(ㄴ) → null (no rule)",
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㄴ" }),
      null,
    ],
    [
      "cho(ㄱ)+jong(ㄱ) → ㄲ (jongseong treated as combinable peer, mirrors reverse order)",
      character({ choseong: "ㄱ" }),
      character({ jongseong: "ㄱ" }),
      character({ choseong: "ㄲ" }),
    ],
    [
      "cho(ㄱ)+jong(ㅅ) → jong(ㄳ) (compound batchim result)",
      character({ choseong: "ㄱ" }),
      character({ jongseong: "ㅅ" }),
      character({ jongseong: "ㄳ" }),
    ],
    [
      "cho(ㄱ)+jong(ㄳ) → null (no rule for ㄱ+ㄳ)",
      character({ choseong: "ㄱ" }),
      character({ jongseong: "ㄳ" }),
      null,
    ],

    // --- Jungseong-only: complex vowel combinations ---
    [
      "jung(ㅏ)+jung(ㅣ) → ㅐ",
      character({ jungseong: "ㅏ" }),
      character({ jungseong: "ㅣ" }),
      character({ jungseong: "ㅐ" }),
    ],
    [
      "jung(ㅑ)+jung(ㅣ) → ㅒ",
      character({ jungseong: "ㅑ" }),
      character({ jungseong: "ㅣ" }),
      character({ jungseong: "ㅒ" }),
    ],
    [
      "jung(ㅓ)+jung(ㅣ) → ㅔ",
      character({ jungseong: "ㅓ" }),
      character({ jungseong: "ㅣ" }),
      character({ jungseong: "ㅔ" }),
    ],
    [
      "jung(ㅕ)+jung(ㅣ) → ㅖ",
      character({ jungseong: "ㅕ" }),
      character({ jungseong: "ㅣ" }),
      character({ jungseong: "ㅖ" }),
    ],
    [
      "jung(ㅗ)+jung(ㅏ) → ㅘ",
      character({ jungseong: "ㅗ" }),
      character({ jungseong: "ㅏ" }),
      character({ jungseong: "ㅘ" }),
    ],
    [
      "jung(ㅗ)+jung(ㅐ) → ㅙ (alternate)",
      character({ jungseong: "ㅗ" }),
      character({ jungseong: "ㅐ" }),
      character({ jungseong: "ㅙ" }),
    ],
    [
      "jung(ㅘ)+jung(ㅣ) → ㅙ (canonical)",
      character({ jungseong: "ㅘ" }),
      character({ jungseong: "ㅣ" }),
      character({ jungseong: "ㅙ" }),
    ],
    [
      "jung(ㅗ)+jung(ㅣ) → ㅚ",
      character({ jungseong: "ㅗ" }),
      character({ jungseong: "ㅣ" }),
      character({ jungseong: "ㅚ" }),
    ],
    [
      "jung(ㅜ)+jung(ㅓ) → ㅝ",
      character({ jungseong: "ㅜ" }),
      character({ jungseong: "ㅓ" }),
      character({ jungseong: "ㅝ" }),
    ],
    [
      "jung(ㅜ)+jung(ㅔ) → ㅞ (alternate)",
      character({ jungseong: "ㅜ" }),
      character({ jungseong: "ㅔ" }),
      character({ jungseong: "ㅞ" }),
    ],
    [
      "jung(ㅝ)+jung(ㅣ) → ㅞ (canonical)",
      character({ jungseong: "ㅝ" }),
      character({ jungseong: "ㅣ" }),
      character({ jungseong: "ㅞ" }),
    ],
    [
      "jung(ㅜ)+jung(ㅣ) → ㅟ",
      character({ jungseong: "ㅜ" }),
      character({ jungseong: "ㅣ" }),
      character({ jungseong: "ㅟ" }),
    ],
    [
      "jung(ㅡ)+jung(ㅣ) → ㅢ",
      character({ jungseong: "ㅡ" }),
      character({ jungseong: "ㅣ" }),
      character({ jungseong: "ㅢ" }),
    ],

    // --- Jungseong-only: other ---
    [
      "jung(ㅏ)+jung(ㅏ) → null (not combinable)",
      character({ jungseong: "ㅏ" }),
      character({ jungseong: "ㅏ" }),
      null,
    ],
    [
      "jung(ㅏ)+jung(ㅓ) → null (not combinable)",
      character({ jungseong: "ㅏ" }),
      character({ jungseong: "ㅓ" }),
      null,
    ],
    [
      "jung(ㅗ)+jung(ㅓ) → null (not combinable)",
      character({ jungseong: "ㅗ" }),
      character({ jungseong: "ㅓ" }),
      null,
    ],
    [
      "jung(ㅏ)+cho(ㄱ) → rearranged: cho leads",
      character({ jungseong: "ㅏ" }),
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
    ],
    [
      "jung(ㅏ)+jong(ㄱ) → null (JONGSEONG_ONLY not valid incoming for JUNGSEONG_ONLY)",
      character({ jungseong: "ㅏ" }),
      character({ jongseong: "ㄱ" }),
      null,
    ],

    // --- Choseong+jungseong: vowel combination ---
    [
      "cho+jung(ㅗ) + jung(ㅏ) → ㅘ",
      character({ choseong: "ㅎ", jungseong: "ㅗ" }),
      character({ jungseong: "ㅏ" }),
      character({ choseong: "ㅎ", jungseong: "ㅘ" }),
    ],
    [
      "cho+jung(ㅘ) + jung(ㅣ) → ㅙ (alternate)",
      character({ choseong: "ㅎ", jungseong: "ㅘ" }),
      character({ jungseong: "ㅣ" }),
      character({ choseong: "ㅎ", jungseong: "ㅙ" }),
    ],
    [
      "cho+jung(ㅏ) + jung(ㅏ) → null",
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
      character({ jungseong: "ㅏ" }),
      null,
    ],

    // --- Choseong+jungseong: incoming consonant or jongseong → jongseong slot ---
    [
      "cho+jung + cho(ㄴ) → full syllable",
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
      character({ choseong: "ㄴ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" }),
    ],
    [
      "cho+jung + jong(ㄳ) → full syllable (direct)",
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
      character({ jongseong: "ㄳ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄳ" }),
    ],

    // --- Full (choseong+jungseong+jongseong): compound batchim upgrade ---
    [
      "full(jong ㄱ)+cho(ㅅ) → jong ㄳ",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄱ" }),
      character({ choseong: "ㅅ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄳ" }),
    ],
    [
      "full(jong ㄴ)+cho(ㅈ) → jong ㄵ",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" }),
      character({ choseong: "ㅈ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄵ" }),
    ],
    [
      "full(jong ㄴ)+cho(ㅎ) → jong ㄶ",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" }),
      character({ choseong: "ㅎ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄶ" }),
    ],
    [
      "full(jong ㄹ)+cho(ㄱ) → jong ㄺ",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" }),
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄺ" }),
    ],
    [
      "full(jong ㄹ)+cho(ㅁ) → jong ㄻ",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" }),
      character({ choseong: "ㅁ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄻ" }),
    ],
    [
      "full(jong ㄹ)+cho(ㅂ) → jong ㄼ",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" }),
      character({ choseong: "ㅂ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄼ" }),
    ],
    [
      "full(jong ㄹ)+cho(ㅅ) → jong ㄽ",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" }),
      character({ choseong: "ㅅ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄽ" }),
    ],
    [
      "full(jong ㄹ)+cho(ㅌ) → jong ㄾ",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" }),
      character({ choseong: "ㅌ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄾ" }),
    ],
    [
      "full(jong ㄹ)+cho(ㅍ) → jong ㄿ",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" }),
      character({ choseong: "ㅍ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄿ" }),
    ],
    [
      "full(jong ㄹ)+cho(ㅎ) → jong ㅀ",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" }),
      character({ choseong: "ㅎ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㅀ" }),
    ],
    [
      "full(jong ㅂ)+cho(ㅅ) → jong ㅄ",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㅂ" }),
      character({ choseong: "ㅅ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㅄ" }),
    ],

    // --- Full: double consonant jongseong ---
    [
      "full(jong ㄱ)+cho(ㄱ) → jong ㄲ (valid jongseong)",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄱ" }),
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄲ" }),
    ],

    // --- Full: null cases ---
    [
      "full(jong ㄱ)+cho(ㄴ) → null (no rule)",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄱ" }),
      character({ choseong: "ㄴ" }),
      null,
    ],
    [
      "full(jong ㄷ)+cho(ㄷ) → null (ㄸ not valid jongseong)",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄷ" }),
      character({ choseong: "ㄷ" }),
      null,
    ],
    [
      "full + jung → null (no 4-part syllables)",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" }),
      character({ jungseong: "ㅏ" }),
      null,
    ],

    // --- Jongseong-only + open syllable: jongseong slots into the syllable ---
    [
      "jong(ㄻ) + open syllable 사 → 삶 (compound batchim becomes jongseong)",
      character({ jongseong: "ㄻ" }),
      character({ choseong: "ㅅ", jungseong: "ㅏ" }),
      character({ choseong: "ㅅ", jungseong: "ㅏ", jongseong: "ㄻ" }),
    ],
    [
      "jong(ㄱ) + open syllable 사 → 삭 (simple jongseong slots in)",
      character({ jongseong: "ㄱ" }),
      character({ choseong: "ㅅ", jungseong: "ㅏ" }),
      character({ choseong: "ㅅ", jungseong: "ㅏ", jongseong: "ㄱ" }),
    ],

    // --- Jongseong-only + choseong: meaningful only for single-jamo JONGSEONG_ONLY ---
    [
      "jong(ㄱ)+cho(ㄱ) → cho ㄲ (double consonant, CHOSEONG_INDEX result)",
      character({ jongseong: "ㄱ" }),
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㄲ" }),
    ],
    [
      "jong(ㄱ)+cho(ㅅ) → jong ㄳ (compound batchim, JONGSEONG_INDEX result)",
      character({ jongseong: "ㄱ" }),
      character({ choseong: "ㅅ" }),
      character({ jongseong: "ㄳ" }),
    ],
    [
      "jong(ㄱ)+cho(ㄴ) → null (no rule)",
      character({ jongseong: "ㄱ" }),
      character({ choseong: "ㄴ" }),
      null,
    ],
    [
      "jong(ㄱ)+jung(ㅏ) → null",
      character({ jongseong: "ㄱ" }),
      character({ jungseong: "ㅏ" }),
      null,
    ],
  ] as [string, Character, Character, Character | null][])(
    "%s",
    (_, target, incoming, expected) => {
      expect(compose(target, incoming)).toEqual(expected);
    },
  );
});

// ---------------------------------------------------------------------------
// decompose()
// ---------------------------------------------------------------------------

describe("decompose", () => {
  it.each([
    // --- Irreducible: returns null ---
    ["empty → null", character(), null],
    ["choseong-only (simple) → null", character({ choseong: "ㄱ" }), null],
    ["jungseong-only (simple) → null", character({ jungseong: "ㅏ" }), null],
    ["simple jongseong-only → null", character({ jongseong: "ㄱ" }), null],

    // --- Jongseong-only compound batchim splits into two choseong ---
    [
      "compound jongseong ㄳ → [cho ㄱ, cho ㅅ]",
      character({ jongseong: "ㄳ" }),
      [character({ choseong: "ㄱ" }), character({ choseong: "ㅅ" })],
    ],
    [
      "compound jongseong ㄺ → [cho ㄹ, cho ㄱ]",
      character({ jongseong: "ㄺ" }),
      [character({ choseong: "ㄹ" }), character({ choseong: "ㄱ" })],
    ],
    [
      "compound jongseong ㄻ → [cho ㄹ, cho ㅁ]",
      character({ jongseong: "ㄻ" }),
      [character({ choseong: "ㄹ" }), character({ choseong: "ㅁ" })],
    ],
    [
      "compound jongseong ㄼ → [cho ㄹ, cho ㅂ]",
      character({ jongseong: "ㄼ" }),
      [character({ choseong: "ㄹ" }), character({ choseong: "ㅂ" })],
    ],
    [
      "compound jongseong ㅄ → [cho ㅂ, cho ㅅ]",
      character({ jongseong: "ㅄ" }),
      [character({ choseong: "ㅂ" }), character({ choseong: "ㅅ" })],
    ],

    // --- Choseong-only double consonants: split into two consonants ---
    [
      "double consonant ㄲ → [cho ㄱ, cho ㄱ]",
      character({ choseong: "ㄲ" }),
      [character({ choseong: "ㄱ" }), character({ choseong: "ㄱ" })],
    ],
    [
      "double consonant ㅆ → [cho ㅅ, cho ㅅ]",
      character({ choseong: "ㅆ" }),
      [character({ choseong: "ㅅ" }), character({ choseong: "ㅅ" })],
    ],

    // --- Jungseong-only complex vowels: split (canonical decompose path) ---
    [
      "complex vowel ㅐ (2-jamo) → [jung ㅏ, jung ㅣ]",
      character({ jungseong: "ㅐ" }),
      [character({ jungseong: "ㅏ" }), character({ jungseong: "ㅣ" })],
    ],
    [
      "complex vowel ㅘ (2-jamo) → [jung ㅗ, jung ㅏ]",
      character({ jungseong: "ㅘ" }),
      [character({ jungseong: "ㅗ" }), character({ jungseong: "ㅏ" })],
    ],
    [
      "complex vowel ㅙ (canonical ㅘ+ㅣ) → [jung ㅘ, jung ㅣ]",
      character({ jungseong: "ㅙ" }),
      [character({ jungseong: "ㅘ" }), character({ jungseong: "ㅣ" })],
    ],
    [
      "complex vowel ㅞ (canonical ㅝ+ㅣ) → [jung ㅝ, jung ㅣ]",
      character({ jungseong: "ㅞ" }),
      [character({ jungseong: "ㅝ" }), character({ jungseong: "ㅣ" })],
    ],

    // --- Choseong + jungseong: peel off jungseong or drill into complex vowel ---
    [
      "cho+jung → [cho, jung]",
      character({ choseong: "ㄱ", jungseong: "ㅏ" }),
      [character({ choseong: "ㄱ" }), character({ jungseong: "ㅏ" })],
    ],
    [
      "cho+jung(ㅘ) → [cho+ㅗ, ㅏ] (complex vowel drills in, choseong stays bound to base)",
      character({ choseong: "ㄱ", jungseong: "ㅘ" }),
      [character({ choseong: "ㄱ", jungseong: "ㅗ" }), character({ jungseong: "ㅏ" })],
    ],

    // --- Full syllable, simple jongseong: peel off as choseong ---
    [
      "full, simple jong ㄴ → [cho+jung, cho ㄴ]",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄴ" }),
      [character({ choseong: "ㄱ", jungseong: "ㅏ" }), character({ choseong: "ㄴ" })],
    ],
    [
      "full, double consonant jong ㄲ → [cho+jung, cho ㄲ]",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄲ" }),
      [character({ choseong: "ㄱ", jungseong: "ㅏ" }), character({ choseong: "ㄲ" })],
    ],

    // --- Full syllable, compound batchim: splits into first+jong, second as choseong ---
    [
      "full, compound jong ㄳ → [cho+jung+ㄱ, cho ㅅ]",
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄳ" }),
      [
        character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄱ" }),
        character({ choseong: "ㅅ" }),
      ],
    ],
    [
      "full, compound jong ㄺ → [cho+jung+ㄹ, cho ㄱ]",
      character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄺ" }),
      [
        character({ choseong: "ㄱ", jungseong: "ㅏ", jongseong: "ㄹ" }),
        character({ choseong: "ㄱ" }),
      ],
    ],
    [
      "full, compound jong ㅄ → [cho+jung+ㅂ, cho ㅅ]",
      character({ choseong: "ㅂ", jungseong: "ㅓ", jongseong: "ㅄ" }),
      [
        character({ choseong: "ㅂ", jungseong: "ㅓ", jongseong: "ㅂ" }),
        character({ choseong: "ㅅ" }),
      ],
    ],
  ] as [string, Character, [Character, Character] | null][])("%s", (_, char, expected) => {
    expect(decompose(char)).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// fullDecompose()
// ---------------------------------------------------------------------------

describe("fullDecompose", () => {
  it("decomposes 한국어 into the correct flat basic jamo Characters", () => {
    // 한 = ㅎ + ㅏ + ㄴ; 국 = ㄱ + ㅜ + ㄱ; 어 = ㅇ + ㅓ
    const input = [
      character({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" })!,
      character({ choseong: "ㄱ", jungseong: "ㅜ", jongseong: "ㄱ" })!,
      character({ choseong: "ㅇ", jungseong: "ㅓ" })!,
    ];
    expect(fullDecompose(input)).toEqual([
      character({ choseong: "ㅎ" }),
      character({ jungseong: "ㅏ" }),
      character({ choseong: "ㄴ" }),
      character({ choseong: "ㄱ" }),
      character({ jungseong: "ㅜ" }),
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㅇ" }),
      character({ jungseong: "ㅓ" }),
    ]);
  });

  it("fully decomposes compound jongseong ㄺ in 닭 (ㄷ ㅏ ㄹ ㄱ)", () => {
    const input = [character({ choseong: "ㄷ", jungseong: "ㅏ", jongseong: "ㄺ" })!];
    expect(fullDecompose(input)).toEqual([
      character({ choseong: "ㄷ" }),
      character({ jungseong: "ㅏ" }),
      character({ choseong: "ㄹ" }),
      character({ choseong: "ㄱ" }),
    ]);
  });

  it("fully decomposes 훿 (complex vowel + compound batchim) → ㅎ ㅜ ㅓ ㅣ ㄱ ㅅ", () => {
    // 훿: choseong=ㅎ, jungseong=ㅞ (→ ㅝ+ㅣ → ㅜ+ㅓ+ㅣ), jongseong=ㄳ (→ ㄱ+ㅅ)
    const input = [character({ choseong: "ㅎ", jungseong: "ㅞ", jongseong: "ㄳ" })!];
    expect(fullDecompose(input)).toEqual([
      character({ choseong: "ㅎ" }),
      character({ jungseong: "ㅜ" }),
      character({ jungseong: "ㅓ" }),
      character({ jungseong: "ㅣ" }),
      character({ choseong: "ㄱ" }),
      character({ choseong: "ㅅ" }),
    ]);
  });

  it("returns irreducible single-jamo Characters unchanged", () => {
    const input = [character({ choseong: "ㄱ" })!, character({ jungseong: "ㅏ" })!];
    expect(fullDecompose(input)).toEqual(input);
  });
});

// ---------------------------------------------------------------------------
// Full jamo workflows
// ---------------------------------------------------------------------------

describe("full jamo workflow: 호 (2 jamo: ㅎ ㅗ)", () => {
  it("decomposes cho+jung → [cho, jung]", () => {
    expect(decompose(character({ choseong: "ㅎ", jungseong: "ㅗ" })!)).toEqual([
      character({ choseong: "ㅎ" }),
      character({ jungseong: "ㅗ" }),
    ]);
  });
  it("recomposes ㅎ → ㅎ+ㅗ → 호", () => {
    expect(compose(character()!, character({ choseong: "ㅎ" })!)).toEqual(
      character({ choseong: "ㅎ" }),
    );
    expect(compose(character({ choseong: "ㅎ" })!, character({ jungseong: "ㅗ" })!)).toEqual(
      character({ choseong: "ㅎ", jungseong: "ㅗ" }),
    );
    expect(resolveCharacter(character({ choseong: "ㅎ", jungseong: "ㅗ" })!)).toBe("호");
  });
});

describe("full jamo workflow: 화 (3 jamo: ㅎ ㅗ ㅏ)", () => {
  it("decomposes cho+jung(ㅘ) → [cho+ㅗ, ㅏ] directly (complex vowel drills in)", () => {
    expect(decompose(character({ choseong: "ㅎ", jungseong: "ㅘ" })!)).toEqual([
      character({ choseong: "ㅎ", jungseong: "ㅗ" }),
      character({ jungseong: "ㅏ" }),
    ]);
  });
  it("recomposes 호 + ㅏ → ㅘ → 화", () => {
    expect(
      compose(character({ choseong: "ㅎ", jungseong: "ㅗ" })!, character({ jungseong: "ㅏ" })!),
    ).toEqual(character({ choseong: "ㅎ", jungseong: "ㅘ" }));
    expect(resolveCharacter(character({ choseong: "ㅎ", jungseong: "ㅘ" })!)).toBe("화");
  });
});

describe("full jamo workflow: 홰 (4 jamo: ㅎ ㅗ ㅏ ㅣ)", () => {
  it("decomposes cho+jung(ㅙ) → [cho+ㅘ, ㅣ], vowel steps same as 화", () => {
    expect(decompose(character({ choseong: "ㅎ", jungseong: "ㅙ" })!)).toEqual([
      character({ choseong: "ㅎ", jungseong: "ㅘ" }),
      character({ jungseong: "ㅣ" }),
    ]);
  });
  it("recomposes 화 + ㅣ → ㅙ → 홰", () => {
    expect(
      compose(character({ choseong: "ㅎ", jungseong: "ㅘ" })!, character({ jungseong: "ㅣ" })!),
    ).toEqual(character({ choseong: "ㅎ", jungseong: "ㅙ" }));
    expect(resolveCharacter(character({ choseong: "ㅎ", jungseong: "ㅙ" })!)).toBe("홰");
  });
});

describe("full jamo workflow: 홱 (5 jamo: ㅎ ㅗ ㅏ ㅣ ㄱ)", () => {
  it("decomposes full(ㅙ,ㄱ) → [cho+jung(ㅙ), cho(ㄱ)], vowel steps same as 홰", () => {
    expect(decompose(character({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄱ" })!)).toEqual([
      character({ choseong: "ㅎ", jungseong: "ㅙ" }),
      character({ choseong: "ㄱ" }),
    ]);
  });
  it("recomposes ㅎ+ㅗ+ㅏ+ㅣ → ㅎ+ㅙ, then +ㄱ → 홱", () => {
    expect(
      compose(character({ choseong: "ㅎ", jungseong: "ㅙ" })!, character({ choseong: "ㄱ" })!),
    ).toEqual(character({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄱ" }));
    expect(resolveCharacter(character({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄱ" })!)).toBe(
      "홱",
    );
  });
});

describe("full jamo workflow: 홳 (6 jamo: ㅎ ㅗ ㅏ ㅣ ㄱ ㅅ)", () => {
  it("decomposes full(ㅙ,ㄳ) → [cho+jung(ㅙ)+ㄱ, cho ㅅ] (compound batchim splits)", () => {
    expect(decompose(character({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄳ" })!)).toEqual([
      character({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄱ" }),
      character({ choseong: "ㅅ" }),
    ]);
  });
  it("recomposes ㅎ+ㅙ+ㄱ → 홱, then +ㅅ → jong ㄳ → 홳", () => {
    expect(
      compose(
        character({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄱ" })!,
        character({ choseong: "ㅅ" })!,
      ),
    ).toEqual(character({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄳ" }));
    expect(resolveCharacter(character({ choseong: "ㅎ", jungseong: "ㅙ", jongseong: "ㄳ" })!)).toBe(
      "홳",
    );
  });
});
