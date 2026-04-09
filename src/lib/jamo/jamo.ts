/**
 * @file jamo.ts
 *
 * Type definitions and Unicode index tables for the jamo domain.
 * Combines type declarations (previously types.ts) with the choseong, jungseong,
 * and jongseong position ordinals per UAX #15, plus their reverse-lookup maps.
 * No imports — all data is inline. All constants are readonly to prevent mutation.
 *
 * Unicode note: all jamo literals use Hangul Compatibility Jamo (U+3130–U+318F).
 * Verify: 'ㄱ'.codePointAt(0) === 0x3131 (not 0x1100).
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/**
 * The 14 basic (unmodified) Korean consonants.
 * Can appear in both choseong and jongseong positions.
 */
export type BasicConsonantJamo =
  | "ㄱ"
  | "ㄴ"
  | "ㄷ"
  | "ㄹ"
  | "ㅁ"
  | "ㅂ"
  | "ㅅ"
  | "ㅇ"
  | "ㅈ"
  | "ㅊ"
  | "ㅋ"
  | "ㅌ"
  | "ㅍ"
  | "ㅎ";

/**
 * The 5 double consonants, formed by combining two identical basic consonants.
 * Valid in choseong position only; ㄸ, ㅃ, and ㅉ cannot appear as jongseong.
 */
export type DoubleConsonantJamo = "ㄲ" | "ㄸ" | "ㅃ" | "ㅆ" | "ㅉ";

/**
 * The 11 compound batchim (jongseong-only consonant clusters).
 * Valid in jongseong position only.
 */
export type CompoundBatchimJamo =
  | "ㄳ"
  | "ㄵ"
  | "ㄶ"
  | "ㄺ"
  | "ㄻ"
  | "ㄼ"
  | "ㄽ"
  | "ㄾ"
  | "ㄿ"
  | "ㅀ"
  | "ㅄ";

/**
 * Every valid consonant jamo the game can produce or place in choseong/jongseong slots.
 * Includes basic consonants (14), double consonants (5), and compound batchim (11).
 * Backward compatible with the previous ConsonantJamo — same 30 members.
 */
export type ConsonantJamo = BasicConsonantJamo | DoubleConsonantJamo | CompoundBatchimJamo;

/**
 * Valid choseong (initial consonant) jamo: basic (14) + double (5) = 19 members.
 * Matches the keys of CHOSEONG_INDEX.
 */
export type ChoseongJamo = BasicConsonantJamo | DoubleConsonantJamo;

/**
 * Valid jongseong (final consonant) jamo: all consonants except the 3 doubles
 * that cannot appear in final position (ㄸ, ㅃ, ㅉ). 27 members.
 * Matches the non-empty keys of JONGSEONG_INDEX.
 */
export type JongseongJamo = Exclude<ConsonantJamo, "ㄸ" | "ㅃ" | "ㅉ">;

/**
 * Every valid vowel jamo the game can produce or place in the jungseong slot.
 * Includes basic vowels and complex vowels (outputs of COMBINATION_RULES).
 */
export type VowelJamo =
  // Basic vowels
  | "ㅏ"
  | "ㅑ"
  | "ㅓ"
  | "ㅕ"
  | "ㅗ"
  | "ㅛ"
  | "ㅜ"
  | "ㅠ"
  | "ㅡ"
  | "ㅣ"
  // Complex vowels
  | "ㅐ"
  | "ㅒ"
  | "ㅔ"
  | "ㅖ"
  | "ㅘ"
  | "ㅙ"
  | "ㅚ"
  | "ㅝ"
  | "ㅞ"
  | "ㅟ"
  | "ㅢ";

/**
 * Every valid Hangul Compatibility Jamo (U+3130–U+318F) that the game can produce.
 */
export type Jamo = ConsonantJamo | VowelJamo;

// ---------------------------------------------------------------------------
// Index tables
// ---------------------------------------------------------------------------

/**
 * Maps each choseong (initial consonant) compatibility jamo to its Unicode
 * position ordinal per UAX #15. Used in syllable block composition.
 * These ordinals are used in UAX #15 syllable block arithmetic
 * (codepoint = 0xAC00 + cho*21*28 + jung*28 + jong) — they are NOT Unicode codepoint offsets.
 *
 * 19 entries: ㄱ(0) through ㅎ(18).
 */
export const CHOSEONG_INDEX: Readonly<Record<ChoseongJamo, number>> = {
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
export const JUNGSEONG_INDEX: Readonly<Record<VowelJamo, number>> = {
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
 * 28 entries: ''(0) through ㅎ(27).
 * Index 0 represents the absence of a final consonant.
 * Note: ㄸ, ㅃ, ㅉ are NOT valid jongseong and do not appear here.
 */
export const JONGSEONG_INDEX: Readonly<Record<JongseongJamo | "", number>> = {
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
