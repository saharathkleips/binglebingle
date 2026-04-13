/**
 * @file word.ts
 *
 * Word type, validation, pool derivation, and pool normalization for the word slice.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: syllable blocks range U+AC00–U+D7A3.
 */

import { character, decompose, isComplete, resolveCharacter } from "../character/character";
import type { Character, CompleteCharacter } from "../character/character";
import { decomposeSyllable } from "../jamo/composition";
import { getRotationBase } from "../jamo/rotation";
import type { Jamo } from "../jamo/jamo";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * An ordered array of complete Korean syllable characters (OPEN_SYLLABLE or
 * FULL_SYLLABLE). Each element is guaranteed to resolve to a codepoint in
 * U+AC00–U+D7A3. Use `createWord` to construct.
 */
export type Word = readonly CompleteCharacter[];

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Validates and constructs a Word from a raw string.
 * Returns null if the string is empty or if any character is not a valid
 * Korean syllable block (U+AC00–U+D7A3).
 *
 * @param s - The raw string to validate
 * @returns A Word (array of CompleteCharacter), or null if validation fails
 */
export function createWord(s: string): Word | null {
  const chars: CompleteCharacter[] = [];
  for (const syllable of s) {
    const decomposed = decomposeSyllable(syllable);
    if (decomposed === null) return null;
    const { choseong, jungseong, jongseong } = decomposed;
    const char = character({
      choseong,
      jungseong,
      ...(jongseong !== null ? { jongseong } : {}),
    });
    if (char === null || !isComplete(char)) return null;
    chars.push(char);
  }
  if (chars.length === 0) return null;
  return chars;
}

/**
 * Fully decomposes every syllable in a Word to basic single-jamo Characters
 * by iterating `decompose` until all Characters are irreducible.
 *
 * @param word - A validated Word
 * @returns Flat ordered array of basic single-jamo Characters
 */
export function derivePool(word: Word): readonly Character[] {
  const queue: Character[] = [...word];
  const result: Character[] = [];
  while (queue.length > 0) {
    const char = queue.shift()!;
    const parts = decompose(char);
    if (parts.length === 1) {
      result.push(char);
    } else {
      queue.unshift(...parts);
    }
  }
  return result;
}

/**
 * Rotates each single-jamo Character to the 0-index member of its rotation set.
 * Non-rotatable jamo are returned unchanged. Called once after `derivePool` at
 * game init to prevent the pool from revealing which target jamo are rotated.
 *
 * @param pool - Ordered array of basic single-jamo Characters (output of derivePool)
 * @returns Array with each jamo normalized to its rotation base
 */
export function normalizePool(pool: readonly Character[]): readonly Character[] {
  return pool.map(normalizeCharacter);
}

/**
 * Converts a Word back to its Unicode string representation.
 *
 * @param word - A validated Word
 * @returns The concatenated syllable block string
 */
export function wordToString(word: Word): string {
  return word.map((char) => resolveCharacter(char) ?? "").join("");
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Rotates a single-jamo Character to the canonical (0-index) member of its
 * rotation set. Non-rotatable or multi-jamo Characters are returned unchanged.
 * @internal
 */
function normalizeCharacter(char: Character): Character {
  switch (char.kind) {
    case "CHOSEONG_ONLY": {
      const base = getRotationBase(char.choseong);
      return character({ choseong: base }) ?? char;
    }
    case "JUNGSEONG_ONLY": {
      const base = getRotationBase(char.jungseong as Jamo);
      return character({ jungseong: base }) ?? char;
    }
    case "JONGSEONG_ONLY": {
      const base = getRotationBase(char.jongseong as Jamo);
      return character({ jongseong: base }) ?? char;
    }
    default:
      return char;
  }
}
