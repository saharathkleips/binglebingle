/**
 * @file rotation.ts
 *
 * Rotation operations for single-jamo Characters — normalizing to the canonical
 * base and advancing through rotation sets.
 *
 * All functions are pure. No React. No side effects.
 */

import { normalizeJamo, getNextRotation as getNextJamoRotation } from "../jamo/rotation";
import { character } from "./index";
import type { Character } from "./index";

// ---------------------------------------------------------------------------
// normalizeCharacter()
// ---------------------------------------------------------------------------

/**
 * Rotates a single-jamo Character to the canonical (0-index) member of its
 * rotation set. Non-rotatable or multi-jamo Characters are returned unchanged.
 * Call this on each element of a derived pool to prevent the pool from
 * revealing which target jamo are rotated.
 *
 * @param char - A single-jamo Character (output of `decompose` until irreducible)
 * @returns The Character with its jamo rotated to its rotation base, or unchanged
 */
export function normalizeCharacter(char: Character): Character {
  switch (char.kind) {
    case "CHOSEONG_ONLY": {
      const base = normalizeJamo(char.choseong);
      return character({ choseong: base }) ?? char;
    }
    case "JUNGSEONG_ONLY": {
      const base = normalizeJamo(char.jungseong);
      return character({ jungseong: base }) ?? char;
    }
    case "JONGSEONG_ONLY": {
      const base = normalizeJamo(char.jongseong);
      return character({ jongseong: base }) ?? char;
    }
    default:
      return char;
  }
}

// ---------------------------------------------------------------------------
// getNextRotation()
// ---------------------------------------------------------------------------

/**
 * Advances a single-jamo Character to the next member of its rotation set (wraps around).
 * Returns null if the Character is not single-jamo or its jamo is not rotatable.
 *
 * @param char - The Character to rotate
 * @returns The Character with its jamo advanced one step, or null if not rotatable
 */
export function getNextRotation(char: Character): Character | null {
  switch (char.kind) {
    case "CHOSEONG_ONLY": {
      const next = getNextJamoRotation(char.choseong);
      return next !== null ? character({ choseong: next }) : null;
    }
    case "JUNGSEONG_ONLY": {
      const next = getNextJamoRotation(char.jungseong);
      return next !== null ? character({ jungseong: next }) : null;
    }
    case "JONGSEONG_ONLY": {
      const next = getNextJamoRotation(char.jongseong);
      return next !== null ? character({ jongseong: next }) : null;
    }
    default:
      return null;
  }
}
