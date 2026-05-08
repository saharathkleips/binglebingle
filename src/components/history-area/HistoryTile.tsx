/**
 * @file HistoryTile.tsx
 *
 * A single tile in the guess history, colored by evaluation result.
 */

import { BaseTile } from "../tile/BaseTile";
import type { BaseTileTone } from "../tile/BaseTile";
import { CharacterTile } from "../tile/CharacterTile";
import type { CharacterResult, EvaluatedCharacter } from "../../lib/engine";

/**
 * Props for the `HistoryTile` component.
 *
 * @property evaluated - The evaluated character to display, including its result classification.
 */
export type HistoryTileProps = {
  evaluated: EvaluatedCharacter;
};

/**
 * Renders a single evaluated tile, displaying the resolved character and applying
 * a shared visual tone based on its result.
 *
 * @param props - {@link HistoryTileProps}
 */
export function HistoryTile({ evaluated }: HistoryTileProps) {
  const sharedProps = {
    dataAttributes: { "data-result": evaluated.result },
    testId: "history-tile",
    tone: RESULT_TONE[evaluated.result],
  };

  if (evaluated.character === undefined) {
    return <BaseTile {...sharedProps}>{""}</BaseTile>;
  }

  return <CharacterTile character={evaluated.character} {...sharedProps} />;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RESULT_TONE: Record<CharacterResult, BaseTileTone> = {
  CORRECT: "correct",
  PRESENT: "present",
  ABSENT: "absent",
};
