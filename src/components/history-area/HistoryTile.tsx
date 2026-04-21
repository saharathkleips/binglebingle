/**
 * @file HistoryTile.tsx
 *
 * A single tile in the guess history, colored by evaluation result.
 */

import { resolveCharacter } from "../../lib/character";
import type { CharacterResult, EvaluatedCharacter } from "../../lib/engine";
import styles from "./HistoryTile.module.css";

/**
 * Props for the `HistoryTile` component.
 *
 * @property evaluated - The evaluated character to display, including its result classification.
 */
export type HistoryTileProps = {
  evaluated: EvaluatedCharacter;
};

const RESULT_CLASS: Record<CharacterResult, string | undefined> = {
  CORRECT: styles.correct,
  PRESENT: styles.present,
  ABSENT: styles.absent,
};

/**
 * Renders a single evaluated tile, displaying the resolved character and applying
 * a CSS class based on its result.
 *
 * @param props - {@link HistoryTileProps}
 */
export function HistoryTile({ evaluated }: HistoryTileProps) {
  const display = evaluated.character ? resolveCharacter(evaluated.character) : "";
  const resultClass = RESULT_CLASS[evaluated.result] ?? "";
  const className = `${styles.tile} ${resultClass}`;

  return (
    <div className={className} data-testid="history-tile" data-result={evaluated.result}>
      {display}
    </div>
  );
}
