/**
 * @file jamo-data.ts
 *
 * All static Unicode data tables and derived runtime lookup maps for the jamo domain.
 * No imports — all data is inline. All constants are readonly to prevent mutation.
 *
 * Unicode note: all jamo literals use Hangul Compatibility Jamo (U+3130–U+318F).
 * Verify: 'ㄱ'.codePointAt(0) === 0x3131 (not 0x1100).
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/** A rule that combines two jamo into a double consonant or complex vowel. */
export type CombinationRule = {
  /** The two input jamo that combine. Order in array matches display order. */
  readonly inputs: readonly [string, string];
  /** The resulting combined jamo. */
  readonly output: string;
  /** Whether this produces a double consonant or a complex vowel. */
  readonly kind: "doubleConsonant" | "complexVowel";
};

/**
 * A rule that upgrades a single jongseong consonant to a compound batchim
 * by adding an additional consonant.
 */
export type JongseongUpgradeRule = {
  /** The single consonant already occupying the jongseong position. */
  readonly existing: string;
  /** The consonant being added to form the compound batchim. */
  readonly additional: string;
  /** The resulting compound batchim jongseong. */
  readonly output: string;
};

// ---------------------------------------------------------------------------
// Choseong (초성) index table — 19 entries
// ---------------------------------------------------------------------------

/**
 * Maps each choseong (initial consonant) compatibility jamo to its Unicode
 * position ordinal per UAX #15. Used in syllable block composition.
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

// ---------------------------------------------------------------------------
// Jungseong (중성) index table — 21 entries
// ---------------------------------------------------------------------------

/**
 * Maps each jungseong (vowel) compatibility jamo to its Unicode position ordinal
 * per UAX #15. Used in syllable block composition.
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

// ---------------------------------------------------------------------------
// Jongseong (종성) index table — 28 entries (index 0 = no final consonant)
// ---------------------------------------------------------------------------

/**
 * Maps each jongseong (final consonant) compatibility jamo to its Unicode
 * position ordinal per UAX #15. Used in syllable block composition.
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

// ---------------------------------------------------------------------------
// Rotation sets and map
// ---------------------------------------------------------------------------

/**
 * The designer-defined rotation equivalence sets.
 * Each set contains jamo that can rotate into one another.
 * Jamo not in any set are not rotatable.
 */
export const ROTATION_SETS: readonly (readonly string[])[] = [
  ["ㄱ", "ㄴ"],
  ["ㅏ", "ㅓ", "ㅗ", "ㅜ"],
  ["ㅣ", "ㅡ"],
  ["ㅑ", "ㅕ", "ㅛ", "ㅠ"],
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

// ---------------------------------------------------------------------------
// Combination rules and map
// ---------------------------------------------------------------------------

/**
 * All combination rules for double consonants (5) and complex vowels (11).
 * 16 entries total. Compound batchim are handled separately via
 * JONGSEONG_UPGRADE_RULES — they do not appear here.
 */
export const COMBINATION_RULES: readonly CombinationRule[] = [
  // Double consonants (5)
  { inputs: ["ㄱ", "ㄱ"], output: "ㄲ", kind: "doubleConsonant" },
  { inputs: ["ㄷ", "ㄷ"], output: "ㄸ", kind: "doubleConsonant" },
  { inputs: ["ㅂ", "ㅂ"], output: "ㅃ", kind: "doubleConsonant" },
  { inputs: ["ㅅ", "ㅅ"], output: "ㅆ", kind: "doubleConsonant" },
  { inputs: ["ㅈ", "ㅈ"], output: "ㅉ", kind: "doubleConsonant" },

  // Complex vowels (11)
  { inputs: ["ㅏ", "ㅣ"], output: "ㅐ", kind: "complexVowel" },
  { inputs: ["ㅑ", "ㅣ"], output: "ㅒ", kind: "complexVowel" },
  { inputs: ["ㅓ", "ㅣ"], output: "ㅔ", kind: "complexVowel" },
  { inputs: ["ㅕ", "ㅣ"], output: "ㅖ", kind: "complexVowel" },
  { inputs: ["ㅗ", "ㅏ"], output: "ㅘ", kind: "complexVowel" },
  { inputs: ["ㅗ", "ㅐ"], output: "ㅙ", kind: "complexVowel" },
  { inputs: ["ㅗ", "ㅣ"], output: "ㅚ", kind: "complexVowel" },
  { inputs: ["ㅜ", "ㅓ"], output: "ㅝ", kind: "complexVowel" },
  { inputs: ["ㅜ", "ㅔ"], output: "ㅞ", kind: "complexVowel" },
  { inputs: ["ㅜ", "ㅣ"], output: "ㅟ", kind: "complexVowel" },
  { inputs: ["ㅡ", "ㅣ"], output: "ㅢ", kind: "complexVowel" },
];

/**
 * Derived runtime lookup map from COMBINATION_RULES.
 * Key format: sorted input pair joined with '|' (e.g. 'ㅏ|ㅣ').
 * Sorting ensures commutativity — argument order does not matter at lookup time.
 * Built once at module load via IIFE.
 */
export const COMBINATION_MAP: ReadonlyMap<string, CombinationRule> = (() => {
  const map = new Map<string, CombinationRule>();
  for (const rule of COMBINATION_RULES) {
    const key = [rule.inputs[0], rule.inputs[1]].sort().join("|");
    map.set(key, rule);
  }
  return map;
})();

// ---------------------------------------------------------------------------
// Jongseong upgrade rules and map
// ---------------------------------------------------------------------------

/**
 * All rules for upgrading a single jongseong to a compound batchim by adding
 * an additional consonant. 11 entries total.
 *
 * These are NOT commutative — existing and additional are ordered.
 * 'ㄱ+ㅅ→ㄳ' is valid; 'ㅅ+ㄱ' has no rule.
 */
export const JONGSEONG_UPGRADE_RULES: readonly JongseongUpgradeRule[] = [
  { existing: "ㄱ", additional: "ㅅ", output: "ㄳ" },
  { existing: "ㄴ", additional: "ㅈ", output: "ㄵ" },
  { existing: "ㄴ", additional: "ㅎ", output: "ㄶ" },
  { existing: "ㄹ", additional: "ㄱ", output: "ㄺ" },
  { existing: "ㄹ", additional: "ㅁ", output: "ㄻ" },
  { existing: "ㄹ", additional: "ㅂ", output: "ㄼ" },
  { existing: "ㄹ", additional: "ㅅ", output: "ㄽ" },
  { existing: "ㄹ", additional: "ㅌ", output: "ㄾ" },
  { existing: "ㄹ", additional: "ㅍ", output: "ㄿ" },
  { existing: "ㄹ", additional: "ㅎ", output: "ㅀ" },
  { existing: "ㅂ", additional: "ㅅ", output: "ㅄ" },
];

/**
 * Derived runtime lookup map from JONGSEONG_UPGRADE_RULES.
 * Key format: 'existing|additional' (NOT sorted — order matters).
 * Built once at module load via IIFE.
 */
export const JONGSEONG_UPGRADE_MAP: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const rule of JONGSEONG_UPGRADE_RULES) {
    map.set(`${rule.existing}|${rule.additional}`, rule.output);
  }
  return map;
})();
