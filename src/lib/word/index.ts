/**
 * @file index.ts
 *
 * Word type and validation for the word slice.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: syllable blocks range U+AC00–U+D7A3.
 */

import { character, resolveCharacter } from "../character";
import type { CompleteCharacter } from "../character";

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
 * @param word - The raw string to validate
 * @returns A Word (array of CompleteCharacter), or null if validation fails
 */
export function createWord(word: string): Word | null {
  const characters = [...word].map((syllable) => character(syllable));
  return characters.length > 0 && characters.every((c): c is CompleteCharacter => c !== null)
    ? characters
    : null;
}

/**
 * Converts a Word back to its Unicode string representation.
 *
 * @param word - A validated Word
 * @returns The concatenated syllable block string
 */
export function wordToString(word: Word): string {
  return word.map((char) => resolveCharacter(char)).join("");
}
