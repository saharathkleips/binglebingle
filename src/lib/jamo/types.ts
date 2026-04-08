/**
 * @file types.ts
 *
 * Jamo type definitions for the jamo domain.
 * All literals use Hangul Compatibility Jamo (U+3130–U+318F).
 */

/**
 * Every valid consonant jamo the game can produce or place in choseong/jongseong slots.
 * Includes basic consonants, double consonants (choseong only), and compound batchim (jongseong only).
 */
export type ConsonantJamo =
  // Basic consonants
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
  | "ㅎ"
  // Double consonants (choseong only — ㄸ ㅃ ㅉ are not valid jongseong)
  | "ㄲ"
  | "ㄸ"
  | "ㅃ"
  | "ㅆ"
  | "ㅉ"
  // Compound batchim (jongseong only)
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
