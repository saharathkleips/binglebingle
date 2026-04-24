/**
 * @file HistoryArea.tsx
 *
 * Displays the guess history as a grid of evaluated tiles.
 */

import { useEffect, useRef } from "react";
import { useGame } from "../../context/game/GameContext";
import { HistoryTile } from "./HistoryTile";
import styles from "./HistoryArea.module.css";

/**
 * Renders the full guess history as rows of evaluated tiles.
 *
 * Returns `null` when no guesses have been made, avoiding empty layout space.
 * Auto-scrolls to the bottom (newest guess) whenever history grows.
 */
export function HistoryArea() {
  const { state } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the newest guess (at the bottom) in view as history grows.
  useEffect(() => {
    if (containerRef.current !== null) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [state.history.length]);

  if (state.history.length === 0) return null;

  return (
    <div ref={containerRef} className={styles.historyArea} data-testid="history-area">
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
