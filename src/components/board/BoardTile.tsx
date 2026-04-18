/**
 * @file BoardTile.tsx
 *
 * A single tile in the guess history board, colored by evaluation result.
 */

import { resolveCharacter } from "../../lib/character";
import type { EvaluatedCharacter } from "../../lib/engine";
import styles from "./BoardTile.module.css";

export type BoardTileProps = {
  evaluated: EvaluatedCharacter;
};

const RESULT_CLASS: Record<string, string | undefined> = {
  CORRECT: styles.correct,
  PRESENT: styles.present,
  ABSENT: styles.absent,
};

export function BoardTile({ evaluated }: BoardTileProps) {
  const display = evaluated.character ? resolveCharacter(evaluated.character) : "";
  const resultClass = RESULT_CLASS[evaluated.result] ?? "";
  const className = `${styles.tile} ${resultClass}`;

  return (
    <div className={className} data-testid="board-tile" data-result={evaluated.result}>
      {display}
    </div>
  );
}
