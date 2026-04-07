/**
 * @file types.ts
 *
 * Character type definition — the central abstraction used by the game state
 * reducer to track what a player is building.
 *
 * Unicode note: all jamo use Hangul Compatibility Jamo (U+3130–U+318F).
 */

/**
 * An ordered list of jamo representing a character under construction.
 * Length is always 0, 1, 2, or 3 — combinations collapse immediately to a single jamo token.
 *
 * - length 0: empty slot
 * - length 1: single jamo (may be a combined jamo like 'ㅐ' or compound batchim 'ㄳ')
 * - length 2: awaiting combination or composition (choseong+jungseong)
 * - length 3: choseong + jungseong + jongseong
 */
export type Character = {
  jamo: readonly string[];
};
