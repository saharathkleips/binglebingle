/**
 * @file rotation.ts
 *
 * Rotation functions for Hangul Compatibility Jamo.
 * A jamo can rotate to other members of its rotation equivalence set.
 * These sets are defined in jamo-data.ts and are designer-controlled.
 */

import { ROTATION_MAP, ROTATION_SETS } from "./jamo-data";

/**
 * Returns all jamo this one can become (excluding itself), or [] if not rotatable.
 * Order matches the rotation set definition order.
 *
 * @param jamo - A Hangul Compatibility Jamo string (U+3130–U+318F)
 * @returns Readonly array of rotation options in set order
 */
export function getRotationOptions(jamo: string): readonly string[] {
  return ROTATION_MAP.get(jamo) ?? [];
}

/**
 * Returns the next jamo when cycling through the rotation set (wraps around).
 * Returns null if the jamo is not rotatable.
 *
 * @param jamo - A Hangul Compatibility Jamo string
 * @returns The next jamo in the set, or null if jamo is not rotatable
 */
export function getNextRotation(jamo: string): string | null {
  const options = ROTATION_MAP.get(jamo);
  if (!options || options.length === 0) return null;
  const set = ROTATION_SETS.find((s) => s.includes(jamo));
  if (!set) return null;
  const idx = set.indexOf(jamo);
  return set[(idx + 1) % set.length] ?? null;
}
