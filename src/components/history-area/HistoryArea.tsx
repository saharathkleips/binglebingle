/**
 * @file HistoryArea.tsx
 *
 * Displays the guess history as a grid of evaluated tiles.
 */

import { useGame } from "../../context/game/GameContext";
import { HistoryTile } from "./HistoryTile";
import styles from "./HistoryArea.module.css";

export function HistoryArea() {
  const { state } = useGame();

  if (state.history.length === 0) return null;

  return (
    <div className={styles.historyArea} data-testid="history-area">
      {state.history.map((guess, rowIndex) => (
        <div key={rowIndex} className={styles.row} data-testid={`history-row-${rowIndex}`}>
          {guess.map((evaluated, colIndex) => (
            <HistoryTile key={colIndex} evaluated={evaluated} />
          ))}
        </div>
      ))}
    </div>
  );
}
