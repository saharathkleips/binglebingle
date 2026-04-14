/**
 * @file rotation.ts
 *
 * Rotation data and functions for Hangul Compatibility Jamo.
 * A jamo can rotate to other members of its rotation equivalence set.
 * These sets are designer-controlled.
 */

import type { Jamo } from "./jamo";

/**
 * Each set contains jamo that can rotate into one another.
 * Jamo not in any set are not rotatable.
 * Vowel sets use clockwise order: ㅏ→ㅜ→ㅓ→ㅗ, ㅑ→ㅠ→ㅕ→ㅛ.
 */
const ROTATION_SETS: readonly (readonly Jamo[])[] = [
  ["ㄱ", "ㄴ"],
  ["ㅏ", "ㅜ", "ㅓ", "ㅗ"],
  ["ㅣ", "ㅡ"],
  ["ㅑ", "ㅠ", "ㅕ", "ㅛ"],
];

/**
 * Returns the next jamo when cycling through the rotation set (wraps around).
 * Returns null if the jamo is not rotatable.
 *
 * @param jamo - A Hangul Compatibility Jamo string
 * @returns The next jamo in the set, or null if jamo is not rotatable
 */
export function getNextRotation(jamo: Jamo): Jamo | null {
  const set = ROTATION_SETS.find((s) => s.includes(jamo));
  if (!set || set.length === 0) return null;
  const idx = set.indexOf(jamo);
  return set[(idx + 1) % set.length] ?? null;
}

/**
 * Returns the 0-index (canonical) member of the rotation set containing this jamo.
 * Returns the jamo unchanged if it is not rotatable.
 *
 * @param jamo - A Hangul Compatibility Jamo string
 * @returns The canonical jamo for this rotation set, or the input if not rotatable
 */
export function normalizeJamo(jamo: Jamo): Jamo {
  const set = ROTATION_SETS.find((s) => s.includes(jamo));
  return set?.[0] ?? jamo;
}
