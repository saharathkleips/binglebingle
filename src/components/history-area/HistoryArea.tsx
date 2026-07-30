/**
 * @file HistoryArea.tsx
 *
 * Displays the guess history as a grid of revealed cards.
 */

import { useLayoutEffect } from "react";
import { useGame } from "../../context/game/GameContext";
import { isWon } from "../../lib/engine/scoring";
import {
  DATA_HISTORY_AREA_ATTRIBUTE,
  DATA_HISTORY_ROW_INDEX_ATTRIBUTE,
} from "../../lib/dom-data-attributes";
import { HistoryCard } from "./HistoryCard";
import styles from "./HistoryArea.module.css";

/**
 * Renders the full guess history as rows of evaluated history cards.
 *
 * Renders an empty accessible region before the first guess without reserving
 * history-row space. Auto-scrolls to the bottom (newest guess) whenever history
 * grows. The submission flow owns the newest-row motion before the row is committed.
 */
export function HistoryArea() {
  const { state, historyAreaRef } = useGame();
  const isGameWon = isWon(state.history);

  useLayoutEffect(() => {
    const container = historyAreaRef.current;
    if (container === null) return;

    scrollHistoryToBottomInstantly(container);
  }, [historyAreaRef, state.history.length]);

  return (
    <section
      ref={historyAreaRef}
      className={styles.historyArea}
      aria-label="도전 기록"
      {...{ [DATA_HISTORY_AREA_ATTRIBUTE]: true }}
    >
      {state.history.map((guess, rowIndex) => (
        <div
          key={rowIndex}
          className={styles.row}
          {...{ [DATA_HISTORY_ROW_INDEX_ATTRIBUTE]: rowIndex }}
        >
          {guess.map((evaluated, colIndex) => (
            <HistoryCard
              key={colIndex}
              evaluated={evaluated}
              isWinDanceEnabled={isGameWon && rowIndex === state.history.length - 1}
            />
          ))}
        </div>
      ))}
    </section>
  );
}

function scrollHistoryToBottomInstantly(container: HTMLElement): void {
  const previousScrollBehavior = container.style.scrollBehavior;
  container.style.scrollBehavior = "auto";
  container.scrollTop = container.scrollHeight;
  container.style.scrollBehavior = previousScrollBehavior;
}
