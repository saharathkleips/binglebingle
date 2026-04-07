/**
 * @file character.ts
 *
 * Character assembly functions — the bridge between raw jamo operations and
 * the game's character model.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: syllable blocks range U+AC00–U+D7A3.
 */

import { combineJamo, composeSyllable } from "../jamo/composition";
import type { Character } from "./types";

/**
 * Reduces a Character's jamo list to its resolved string form.
 *
 * Resolution rules (per docs/plan-jamo.md Step 7):
 * - length 0: null
 * - length 1: return jamo[0] as-is
 * - length 2: try combineJamo first; if null try composeSyllable; if null return null
 * - length 3: composeSyllable(jamo[0], jamo[1], jamo[2]) or null
 *
 * @param character - The Character to resolve
 * @returns The resolved string, or null if the jamo cannot be reduced
 */
export function resolveCharacter(character: Character): string | null {
  const { jamo } = character;

  if (jamo.length === 0) return null;

  if (jamo.length === 1) {
    // noUncheckedIndexedAccess: jamo[0] is string | undefined
    return jamo[0] ?? null;
  }

  if (jamo.length === 2) {
    const a = jamo[0];
    const b = jamo[1];
    if (a === undefined || b === undefined) return null;
    const combined = combineJamo(a, b);
    if (combined !== null) return combined;
    return composeSyllable(a, b) ?? null;
  }

  if (jamo.length === 3) {
    const a = jamo[0];
    const b = jamo[1];
    const c = jamo[2];
    if (a === undefined || b === undefined || c === undefined) return null;
    return composeSyllable(a, b, c) ?? null;
  }

  // Should not be reachable — combinations always collapse pairwise to single jamo
  return null;
}

/**
 * Returns true iff resolveCharacter produces a valid Korean syllable block (U+AC00–U+D7A3).
 * A complete character is one that can be placed in a submission slot.
 *
 * @param character - The Character to test
 * @returns Whether the character is a complete syllable block
 */
export function isComplete(character: Character): boolean {
  const resolved = resolveCharacter(character);
  if (resolved === null) return false;
  const cp = resolved.codePointAt(0);
  return cp !== undefined && cp >= 0xac00 && cp <= 0xd7a3;
}
