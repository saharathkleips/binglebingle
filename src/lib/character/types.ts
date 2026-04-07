/**
 * @file types.ts
 *
 * Character type definitions — the central abstractions used by the game state
 * reducer to track what a player is building.
 *
 * Unicode note: all jamo literals use Hangul Compatibility Jamo (U+3130–U+318F),
 * never Hangul Jamo (U+1100–U+11FF). The distinction matters for codepoint
 * arithmetic: do not mix the two blocks.
 *
 * The `Jamo` union is the exhaustive set of all jamo the game can produce —
 * derived from the keys of CHOSEONG_INDEX, JUNGSEONG_INDEX (including complex
 * vowel outputs), and JONGSEONG_INDEX (non-empty keys, including compound batchim
 * outputs) in jamo-data.ts.
 */

/**
 * Every valid Hangul Compatibility Jamo (U+3130–U+318F) that the game can
 * produce or place in a Character slot.
 *
 * Ordering: consonants first (basic, then double, then compound batchim),
 * vowels second (basic, then complex). Exact ordering within the union has no
 * runtime effect.
 */
export type Jamo =
  // Basic consonants (choseong / jongseong)
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
  // Double consonants (choseong only — ㄸ ㅃ ㅉ not valid jongseong)
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
  | "ㅄ"
  // Basic vowels (jungseong)
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
  // Complex vowels (jungseong — outputs of COMBINATION_RULES)
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
 * A Korean syllable character under construction.
 *
 * Each slot holds a single `Jamo` token. Combinations collapse immediately —
 * e.g. two consonants become one double consonant before being stored.
 *
 * - `{}` — empty slot (nothing placed yet)
 * - `{ choseong }` — single consonant (may be a double consonant like ㄲ)
 * - `{ jungseong }` — single vowel (may be a complex vowel like ㅘ)
 * - `{ choseong, jungseong }` — open syllable or partial block
 * - `{ choseong, jungseong, jongseong }` — closed syllable block
 *
 * Use `combine(a, b)` to add jamo to a Character in a state-machine fashion.
 * Use `resolveCharacter(char)` to render the Character as a Unicode string.
 */
export type Character = {
  choseong?: Jamo;
  jungseong?: Jamo;
  jongseong?: Jamo;
};
