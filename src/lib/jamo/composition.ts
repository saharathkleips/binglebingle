/**
 * @file composition.ts
 *
 * Combination data, jamo combination, and syllable composition/decomposition functions.
 * Implements the core "combine" and "compose" mechanics used throughout the game.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: all jamo use Hangul Compatibility Jamo (U+3130–U+318F).
 */

import {
  CHOSEONG_BY_INDEX,
  CHOSEONG_INDEX,
  JONGSEONG_BY_INDEX,
  JONGSEONG_INDEX,
  JUNGSEONG_BY_INDEX,
  JUNGSEONG_INDEX,
} from "./jamo-data";

// ---------------------------------------------------------------------------
// Syllable base codepoint (UAX #15)
// ---------------------------------------------------------------------------

const SYLLABLE_BASE = 0xac00;

// ---------------------------------------------------------------------------
// Combination data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Combines two jamo into a double consonant or complex vowel, if a combination
 * rule exists. Commutative — argument order does not affect the result.
 *
 * Does NOT handle compound batchim (e.g. ㄱ+ㅅ → ㄳ). Use upgradeJongseong for that.
 *
 * @param a - First Hangul Compatibility Jamo string
 * @param b - Second Hangul Compatibility Jamo string
 * @returns The combined jamo, or null if no combination rule exists
 */
export function combineJamo(a: string, b: string): string | null {
  const key = [a, b].sort().join("|");
  const rule = COMBINATION_MAP.get(key);
  return rule?.output ?? null;
}

/**
 * Upgrades a single jongseong consonant to a compound batchim by adding an
 * additional consonant. Not commutative — argument order matters.
 *
 * Use this when adding a consonant to a Character that already has choseong +
 * jungseong + single jongseong.
 *
 * @param existingJongseong - The consonant already in the jongseong position
 * @param additional - The consonant being added
 * @returns The compound batchim jongseong, or null if no upgrade rule exists
 */
export function upgradeJongseong(existingJongseong: string, additional: string): string | null {
  const key = `${existingJongseong}|${additional}`;
  return JONGSEONG_UPGRADE_MAP.get(key) ?? null;
}

/**
 * Composes a Korean syllable block from choseong, jungseong, and optional jongseong.
 * Returns null if any component is not valid for its position.
 *
 * @param choseong - Initial consonant (Hangul Compatibility Jamo)
 * @param jungseong - Vowel (Hangul Compatibility Jamo)
 * @param jongseong - Optional final consonant (Hangul Compatibility Jamo)
 * @returns The composed syllable block character, or null if inputs are invalid
 */
export function composeSyllable(
  choseong: string,
  jungseong: string,
  jongseong?: string,
): string | null {
  const cho = CHOSEONG_INDEX[choseong];
  const jung = JUNGSEONG_INDEX[jungseong];
  const jong = JONGSEONG_INDEX[jongseong ?? ""];

  if (cho === undefined || jung === undefined || jong === undefined) return null;

  const codepoint = SYLLABLE_BASE + (cho * 21 + jung) * 28 + jong;
  return String.fromCodePoint(codepoint);
}

/**
 * Decomposes a Korean syllable block into its choseong, jungseong, and jongseong
 * components. Returns null if the input is not a syllable block (U+AC00–U+D7A3).
 *
 * All returned jamo use Hangul Compatibility Jamo codepoints (U+3130–U+318F).
 *
 * @param syllable - A single Korean syllable block character
 * @returns The decomposed jamo components, or null if input is not a syllable block
 */
export function decomposeSyllable(
  syllable: string,
): { choseong: string; jungseong: string; jongseong: string | null } | null {
  const cp = syllable.codePointAt(0);
  if (cp === undefined || cp < 0xac00 || cp > 0xd7a3) return null;

  const offset = cp - SYLLABLE_BASE;
  const jongIdx = offset % 28;
  const jungIdx = Math.floor(offset / 28) % 21;
  const choIdx = Math.floor(offset / 28 / 21);

  const choseong = CHOSEONG_BY_INDEX[choIdx];
  const jungseong = JUNGSEONG_BY_INDEX[jungIdx];
  // jongIdx === 0 means no final consonant
  const jongseong = jongIdx === 0 ? null : (JONGSEONG_BY_INDEX[jongIdx] ?? null);

  if (choseong === undefined || jungseong === undefined) return null;

  return { choseong, jungseong, jongseong };
}
