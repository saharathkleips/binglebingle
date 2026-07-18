/**
 * @file HistoryTile.tsx
 *
 * A single tile in the guess history, colored by evaluation result.
 */

import { BaseTile } from "../tile/BaseTile";
import { CharacterTile } from "../tile/CharacterTile";
import type { EvaluatedCharacter } from "../../lib/engine";

/** Props for the `HistoryTile` component. */
export type HistoryTileProps = {
  /** Evaluated character to display, including its result classification. */
  evaluated: EvaluatedCharacter;
};

/**
 * Renders a single evaluated tile, displaying the resolved character and applying
 * shared result styling.
 *
 * @param props - {@link HistoryTileProps}
 */
export function HistoryTile({ evaluated }: HistoryTileProps) {
  const sharedProps = {
    dataAttributes: { "data-result": evaluated.result, "data-history-tile": true },
    result: evaluated.result,
  };

  if (evaluated.character === undefined) {
    return <BaseTile {...sharedProps}>{""}</BaseTile>;
  }

  return <CharacterTile character={evaluated.character} {...sharedProps} />;
}
