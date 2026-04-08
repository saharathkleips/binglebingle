/**
 * @file types.ts
 *
 * Character type definitions — the central abstractions used by the game state
 * reducer to track what a player is building.
 *
 * The `Jamo`, `ConsonantJamo`, and `VowelJamo` types are defined in
 * `../jamo/types` and re-exported here for convenience.
 *
 * Unicode note: all jamo literals use Hangul Compatibility Jamo (U+3130–U+318F),
 * never Hangul Jamo (U+1100–U+11FF). The distinction matters for codepoint
 * arithmetic: do not mix the two blocks.
 */

import type { ConsonantJamo, VowelJamo, Jamo } from "../jamo/types";

export type { ConsonantJamo, VowelJamo, Jamo };

/**
 * A Korean syllable character under construction.
 *
 * Each slot holds a single jamo token. Combinations collapse immediately —
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
  choseong?: ConsonantJamo;
  jungseong?: VowelJamo;
  jongseong?: ConsonantJamo;
};
