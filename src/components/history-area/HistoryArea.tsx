/**
 * @file HistoryArea.tsx
 *
 * Displays the guess history as a grid of evaluated tiles.
 * Animates new rows in with a slide + staggered tile flip (VIS-25).
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import { useGame } from "../../context/game/GameContext";
import { animateHistoryRowReveal } from "../../lib/animation/tile-animations";
import { HistoryTile } from "./HistoryTile";
import styles from "./HistoryArea.module.css";

/**
 * Renders the full guess history as rows of evaluated tiles.
 *
 * Returns `null` when no guesses have been made, avoiding empty layout space.
 * Auto-scrolls to the bottom (newest guess) whenever history grows.
 * Animates the newest row in with a slide and per-tile flip stagger.
 */
export function HistoryArea() {
  const { state } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(state.history.length);
  const revealTimelineRef = useRef<ReturnType<typeof animateHistoryRowReveal> | null>(null);

  // Keep the newest guess in view as history grows.
  useEffect(() => {
    if (containerRef.current !== null) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [state.history.length]);

  // VIS-25: animate the newest row in after each submission.
  useLayoutEffect(() => {
    if (state.history.length > prevLengthRef.current && containerRef.current !== null) {
      const rows = containerRef.current.querySelectorAll('[data-testid^="history-row-"]');
      const lastRow = rows[rows.length - 1];
      if (lastRow instanceof HTMLElement) {
        revealTimelineRef.current?.kill();
        revealTimelineRef.current = animateHistoryRowReveal(lastRow);
      }
    }
    prevLengthRef.current = state.history.length;
  }, [state.history.length]);

  // Kill any in-progress reveal timeline on unmount.
  useLayoutEffect(() => {
    return () => {
      revealTimelineRef.current?.kill();
    };
  }, []);

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
