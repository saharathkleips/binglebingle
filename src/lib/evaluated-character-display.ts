/**
 * @file evaluated-character-display.ts
 *
 * Pure display helpers for evaluated submission slots.
 */

import { resolveCharacter } from "./character";
import type { EvaluatedCharacter } from "./engine";

/** Returns the visible text for an evaluated character, or an empty string for empty slots. */
export function getEvaluatedCharacterText(evaluated: EvaluatedCharacter): string {
  if (evaluated.character === undefined) return "";

  return resolveCharacter(evaluated.character) ?? "";
}

/** Returns whether an evaluated character should render as an empty history card. */
export function isEvaluatedCharacterEmpty(evaluated: EvaluatedCharacter): boolean {
  return getEvaluatedCharacterText(evaluated) === "";
}
