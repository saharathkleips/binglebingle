/**
 * @file rotation.ts
 *
 * Rotation data and functions for Hangul Compatibility Jamo.
 * A jamo can rotate to other members of its rotation equivalence set.
 * These sets are designer-controlled.
 */

import type { Jamo } from "./types";

/**
 * Each set contains jamo that can rotate into one another.
 * Jamo not in any set are not rotatable.
 * Vowel sets use clockwise order: ㅏ→ㅜ→ㅓ→ㅗ, ㅑ→ㅠ→ㅕ→ㅛ.
 */
export const ROTATION_SETS: readonly (readonly string[])[] = [
  ["ㄱ", "ㄴ"],
  ["ㅏ", "ㅜ", "ㅓ", "ㅗ"],
  ["ㅣ", "ㅡ"],
  ["ㅑ", "ㅠ", "ㅕ", "ㅛ"],
];

/**
 * Derived runtime lookup map from ROTATION_SETS.
 * Maps each rotatable jamo to all other members of its set (excluding itself).
 * Built once at module load via IIFE.
 */
export const ROTATION_MAP: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const set of ROTATION_SETS) {
    for (const jamo of set) {
      map.set(
        jamo,
        set.filter((j) => j !== jamo),
      );
    }
  }
  return map;
})();

/**
 * Returns the next jamo when cycling through the rotation set (wraps around).
 * Returns null if the jamo is not rotatable.
 *
 * @param jamo - A Hangul Compatibility Jamo string
 * @returns The next jamo in the set, or null if jamo is not rotatable
 */
export function getNextRotation(jamo: Jamo): string | null {
  const options = ROTATION_MAP.get(jamo);
  if (!options || options.length === 0) return null;
  const set = ROTATION_SETS.find((s) => s.includes(jamo));
  if (!set) return null;
  const idx = set.indexOf(jamo);
  return set[(idx + 1) % set.length] ?? null;
}
