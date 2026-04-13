/**
 * @file word.ts
 *
 * Word branded type, validation, jamo decomposition, pool derivation, and
 * pool normalization for the word slice.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: all jamo use Hangul Compatibility Jamo (U+3130–U+318F).
 */

import { decomposeJamo as decomposeCombinedJamo, decomposeSyllable } from "../jamo/composition";
import { getRotationBase } from "../jamo/rotation";
import type { Jamo } from "../jamo/jamo";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A validated, non-empty string of Korean syllable blocks (U+AC00–U+D7A3).
 * The brand prevents plain strings from being passed where a validated Word is expected.
 */
export type Word = string & { readonly _brand: "Word" };

/** Strategies for selecting a word from the word list. */
export type WordSelectionStrategy =
  | { kind: "daily" }
  | { kind: "random" }
  | { kind: "fixed"; word: string }
  | { kind: "byDate"; date: string }; // ISO date 'YYYY-MM-DD'

// ---------------------------------------------------------------------------
// Syllable block range
// ---------------------------------------------------------------------------

const SYLLABLE_START = 0xac00;
const SYLLABLE_END = 0xd7a3;

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Validates and brands a raw string as a Word.
 * Returns null if the string is empty or if any character is outside U+AC00–U+D7A3.
 *
 * @param s - The raw string to validate
 * @returns A branded Word, or null if validation fails
 */
export function createWord(s: string): Word | null {
  const chars = [...s];
  if (chars.length === 0) return null;
  for (const ch of chars) {
    const cp = ch.codePointAt(0);
    if (cp === undefined || cp < SYLLABLE_START || cp > SYLLABLE_END) return null;
  }
  return s as Word;
}

/**
 * Decomposes a jamo by one step into its immediate constituents.
 * Mirrors the player's split action.
 *
 * - Combined jamo (double consonants, complex vowels, compound batchim) → [left, right]
 * - Basic jamo → [jamo] unchanged
 *
 * @param jamo - A Hangul Compatibility Jamo string
 * @returns Array of one or two jamo
 */
export function decomposeJamo(jamo: string): string[] {
  const parts = decomposeCombinedJamo(jamo as Jamo);
  if (parts !== null) return [...parts];
  return [jamo];
}

/**
 * Fully decomposes every syllable in a Word to basic jamo by iterating
 * decomposeJamo until stable.
 *
 * @param word - A validated Word
 * @returns Flat ordered array of basic jamo
 */
export function derivePool(word: Word): readonly string[] {
  const result: string[] = [];
  for (const syllable of word) {
    const decomposed = decomposeSyllable(syllable);
    if (decomposed === null) continue;

    const { choseong, jungseong, jongseong } = decomposed;
    // Choseong: iteratively decompose until basic
    result.push(...toBasicJamo(choseong));
    // Jungseong: iteratively decompose until basic
    result.push(...toBasicJamo(jungseong));
    // Jongseong: iteratively decompose until basic (only if present)
    if (jongseong !== null) {
      result.push(...toBasicJamo(jongseong));
    }
  }
  return result;
}

/**
 * Rotates each jamo to the 0-index member of its rotation set.
 * Non-rotatable jamo are returned unchanged.
 *
 * @param jamo - Ordered array of basic jamo (output of derivePool)
 * @returns Array with each jamo normalized to its rotation base
 */
export function normalizePool(jamo: readonly string[]): readonly string[] {
  return jamo.map((j) => getRotationBase(j as Jamo));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Iteratively decomposes a jamo until it is no longer a combination result.
 * Returns a flat array of basic jamo.
 * @internal
 */
function toBasicJamo(jamo: string): string[] {
  let queue = [jamo];
  const basic: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const parts = decomposeCombinedJamo(current as Jamo);
    if (parts !== null) {
      queue = [...parts, ...queue];
    } else {
      basic.push(current);
    }
  }
  return basic;
}
