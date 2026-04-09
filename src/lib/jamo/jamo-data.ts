/**
 * @file jamo-data.ts
 *
 * All static Unicode data tables and derived runtime lookup maps for the jamo domain.
 * No imports — all data is inline. All constants are readonly to prevent mutation.
 *
 * Unicode note: all jamo literals use Hangul Compatibility Jamo (U+3130–U+318F).
 * Verify: 'ㄱ'.codePointAt(0) === 0x3131 (not 0x1100).
 */

/** A rule that combines two jamo into a double consonant, complex vowel, or compound batchim. */
export type CombinationRule = {
  /** The two input jamo that combine. Order in array matches display order. */
  readonly inputs: readonly [string, string];
  /** The resulting combined jamo. */
  readonly output: string;
  /** Whether this produces a double consonant, a complex vowel, or a compound batchim. */
  readonly kind: "DOUBLE_CONSONANT" | "COMPLEX_VOWEL" | "COMPOUND_BATCHIM";
};

/**
 * Maps each choseong (initial consonant) compatibility jamo to its Unicode
 * position ordinal per UAX #15. Used in syllable block composition.
 * These ordinals are used in UAX #15 syllable block arithmetic
 * (codepoint = 0xAC00 + cho*21*28 + jung*28 + jong) — they are NOT Unicode codepoint offsets.
 *
 * 19 entries: ㄱ(0) through ㅎ(18).
 */
export const CHOSEONG_INDEX: Readonly<Record<string, number>> = {
  ㄱ: 0,
  ㄲ: 1,
  ㄴ: 2,
  ㄷ: 3,
  ㄸ: 4,
  ㄹ: 5,
  ㅁ: 6,
  ㅂ: 7,
  ㅃ: 8,
  ㅅ: 9,
  ㅆ: 10,
  ㅇ: 11,
  ㅈ: 12,
  ㅉ: 13,
  ㅊ: 14,
  ㅋ: 15,
  ㅌ: 16,
  ㅍ: 17,
  ㅎ: 18,
};

/**
 * Reverse-lookup map from choseong ordinal index → compatibility jamo string.
 * Built once at module load. Used in decomposition arithmetic.
 */
export const CHOSEONG_BY_INDEX: Readonly<Record<number, string>> = Object.fromEntries(
  Object.entries(CHOSEONG_INDEX).map(([k, v]) => [v, k]),
);

/**
 * Maps each jungseong (vowel) compatibility jamo to its Unicode position ordinal
 * per UAX #15. Used in syllable block composition.
 * These ordinals are used in UAX #15 syllable block arithmetic
 * (codepoint = 0xAC00 + cho*21*28 + jung*28 + jong) — they are NOT Unicode codepoint offsets.
 *
 * 21 entries: ㅏ(0) through ㅣ(20).
 */
export const JUNGSEONG_INDEX: Readonly<Record<string, number>> = {
  ㅏ: 0,
  ㅐ: 1,
  ㅑ: 2,
  ㅒ: 3,
  ㅓ: 4,
  ㅔ: 5,
  ㅕ: 6,
  ㅖ: 7,
  ㅗ: 8,
  ㅘ: 9,
  ㅙ: 10,
  ㅚ: 11,
  ㅛ: 12,
  ㅜ: 13,
  ㅝ: 14,
  ㅞ: 15,
  ㅟ: 16,
  ㅠ: 17,
  ㅡ: 18,
  ㅢ: 19,
  ㅣ: 20,
};

/**
 * Reverse-lookup map from jungseong ordinal index → compatibility jamo string.
 * Built once at module load. Used in decomposition arithmetic.
 */
export const JUNGSEONG_BY_INDEX: Readonly<Record<number, string>> = Object.fromEntries(
  Object.entries(JUNGSEONG_INDEX).map(([k, v]) => [v, k]),
);

/**
 * Maps each jongseong (final consonant) compatibility jamo to its Unicode
 * position ordinal per UAX #15. Used in syllable block composition.
 * These ordinals are used in UAX #15 syllable block arithmetic
 * (codepoint = 0xAC00 + cho*21*28 + jung*28 + jong) — they are NOT Unicode codepoint offsets.
 *
 * 28 entries: ''(0) through ㅎ(26).
 * Index 0 represents the absence of a final consonant.
 * Note: ㄸ, ㅃ, ㅉ are NOT valid jongseong and do not appear here.
 */
export const JONGSEONG_INDEX: Readonly<Record<string, number>> = {
  "": 0,
  ㄱ: 1,
  ㄲ: 2,
  ㄳ: 3,
  ㄴ: 4,
  ㄵ: 5,
  ㄶ: 6,
  ㄷ: 7,
  ㄹ: 8,
  ㄺ: 9,
  ㄻ: 10,
  ㄼ: 11,
  ㄽ: 12,
  ㄾ: 13,
  ㄿ: 14,
  ㅀ: 15,
  ㅁ: 16,
  ㅂ: 17,
  ㅄ: 18,
  ㅅ: 19,
  ㅆ: 20,
  ㅇ: 21,
  ㅈ: 22,
  ㅊ: 23,
  ㅋ: 24,
  ㅌ: 25,
  ㅍ: 26,
  ㅎ: 27,
};

/**
 * Reverse-lookup map from jongseong ordinal index → compatibility jamo string.
 * Built once at module load. Used in decomposition arithmetic.
 */
export const JONGSEONG_BY_INDEX: Readonly<Record<number, string>> = Object.fromEntries(
  Object.entries(JONGSEONG_INDEX).map(([k, v]) => [v, k]),
);

/**
 * Each set contains jamo that can rotate into one another.
 * Jamo not in any set are not rotatable.
 * Vowel sets use clockwise order: ㅏ→ㅜ→ㅓ→ㅗ, ㅑ→ㅠ→ㅕ→ㅛ.
 */
export const ROTATION_SETS: readonly (readonly string[])[] = [
  ["ㄱ", "ㄴ"],
  ["ㅏ", "ㅜ", "ㅓ", "ㅗ"],
  ["ㅣ", "ㅡ"],
  ["ㅑ", "ㅠ", "ㅕ", "ㅛ"],
];

/**
 * Derived runtime lookup map from ROTATION_SETS.
 * Maps each rotatable jamo to all other members of its set (excluding itself).
 * Built once at module load via IIFE.
 */
export const ROTATION_MAP: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const set of ROTATION_SETS) {
    for (const jamo of set) {
      map.set(
        jamo,
        set.filter((j) => j !== jamo),
      );
    }
  }
  return map;
})();

/**
 * All combination rules: double consonants (5), complex vowels (11), and
 * compound batchim (11). 27 entries total.
 *
 * DOUBLE_CONSONANT and COMPLEX_VOWEL rules are commutative (COMBINATION_MAP uses sorted keys).
 * COMPOUND_BATCHIM rules are NOT commutative (JONGSEONG_UPGRADE_MAP uses ordered keys).
 */
export const COMBINATION_RULES: readonly CombinationRule[] = [
  // Double consonants (5)
  { inputs: ["ㄱ", "ㄱ"], output: "ㄲ", kind: "DOUBLE_CONSONANT" },
  { inputs: ["ㄷ", "ㄷ"], output: "ㄸ", kind: "DOUBLE_CONSONANT" },
  { inputs: ["ㅂ", "ㅂ"], output: "ㅃ", kind: "DOUBLE_CONSONANT" },
  { inputs: ["ㅅ", "ㅅ"], output: "ㅆ", kind: "DOUBLE_CONSONANT" },
  { inputs: ["ㅈ", "ㅈ"], output: "ㅉ", kind: "DOUBLE_CONSONANT" },

  // Complex vowels (11)
  { inputs: ["ㅏ", "ㅣ"], output: "ㅐ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅑ", "ㅣ"], output: "ㅒ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅓ", "ㅣ"], output: "ㅔ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅕ", "ㅣ"], output: "ㅖ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅗ", "ㅏ"], output: "ㅘ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅗ", "ㅐ"], output: "ㅙ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅗ", "ㅣ"], output: "ㅚ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅜ", "ㅓ"], output: "ㅝ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅜ", "ㅔ"], output: "ㅞ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅜ", "ㅣ"], output: "ㅟ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅡ", "ㅣ"], output: "ㅢ", kind: "COMPLEX_VOWEL" },

  // Compound batchim (11)
  { inputs: ["ㄱ", "ㅅ"], output: "ㄳ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄴ", "ㅈ"], output: "ㄵ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄴ", "ㅎ"], output: "ㄶ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㄱ"], output: "ㄺ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅁ"], output: "ㄻ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅂ"], output: "ㄼ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅅ"], output: "ㄽ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅌ"], output: "ㄾ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅍ"], output: "ㄿ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅎ"], output: "ㅀ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㅂ", "ㅅ"], output: "ㅄ", kind: "COMPOUND_BATCHIM" },
];

/**
 * Derived runtime lookup map from COMBINATION_RULES (DOUBLE_CONSONANT + COMPLEX_VOWEL only).
 * Key format: sorted input pair joined with '|' (e.g. 'ㅏ|ㅣ').
 * Sorting ensures commutativity — argument order does not matter at lookup time.
 * Built once at module load via IIFE. 16 entries total.
 */
export const COMBINATION_MAP: ReadonlyMap<string, CombinationRule> = (() => {
  const map = new Map<string, CombinationRule>();
  for (const rule of COMBINATION_RULES) {
    if (rule.kind === "DOUBLE_CONSONANT" || rule.kind === "COMPLEX_VOWEL") {
      const key = [rule.inputs[0], rule.inputs[1]].sort().join("|");
      map.set(key, rule);
    }
  }
  return map;
})();

/**
 * Returns the CombinationRule for two jamo if one exists, or undefined.
 * Handles DOUBLE_CONSONANT and COMPLEX_VOWEL combinations (commutative).
 * Does NOT handle COMPOUND_BATCHIM — use JONGSEONG_UPGRADE_MAP for that.
 *
 * @param a - First Hangul Compatibility Jamo string
 * @param b - Second Hangul Compatibility Jamo string
 */
export function combinationOf(a: string, b: string): CombinationRule | undefined {
  const key = [a, b].sort().join("|");
  return COMBINATION_MAP.get(key);
}

/**
 * Derived runtime lookup map from COMBINATION_RULES (COMPOUND_BATCHIM subset only).
 * Key format: 'existing|additional' (NOT sorted — order matters).
 * Built once at module load via IIFE. 11 entries total.
 *
 * These are NOT commutative — existing and additional are ordered.
 * 'ㄱ+ㅅ→ㄳ' is valid; 'ㅅ+ㄱ' has no rule.
 */
export const JONGSEONG_UPGRADE_MAP: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const rule of COMBINATION_RULES) {
    if (rule.kind === "COMPOUND_BATCHIM") {
      map.set(`${rule.inputs[0]}|${rule.inputs[1]}`, rule.output);
    }
  }
  return map;
})();
