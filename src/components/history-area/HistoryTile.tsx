/**
 * @file HistoryTile.tsx
 *
 * A single tile in the guess history, colored by evaluation result.
 */

import { resolveCharacter } from "../../lib/character";
import type { EvaluatedCharacter } from "../../lib/engine";
import styles from "./HistoryTile.module.css";

export type HistoryTileProps = {
  evaluated: EvaluatedCharacter;
};

const RESULT_CLASS: Record<string, string | undefined> = {
  CORRECT: styles.correct,
  PRESENT: styles.present,
  ABSENT: styles.absent,
};

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
