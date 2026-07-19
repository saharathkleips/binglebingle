/**
 * @file HistoryArea.tsx
 *
 * Displays the guess history as a grid of evaluated tiles.
 * Animates new rows in with a slide + staggered tile flip (VIS-25).
 */

import { useLayoutEffect, useRef } from "react";
import { useGame } from "../../context/game/GameContext";
import { animateHistoryRowReveal } from "../../lib/animation/tile-animations";
import { HistoryTile } from "./HistoryTile";
import styles from "./HistoryArea.module.css";

/**
 * Renders the full guess history as rows of evaluated tiles.
 *
 * Renders an empty accessible region before the first guess without reserving
 * history-row space. Auto-scrolls to the bottom (newest guess) whenever history
 * grows.
 * Animates the newest row in with a slide and per-tile flip stagger.
 */
export function HistoryArea() {
  const { state } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(state.history.length);
  const revealTimelineRef = useRef<ReturnType<typeof animateHistoryRowReveal> | null>(null);

  // VIS-25: animate new submissions and keep the newest guess in view.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      prevLengthRef.current = state.history.length;
      return;
    }

    if (state.history.length > prevLengthRef.current) {
      const lastRow = container.lastElementChild;
      if (lastRow instanceof HTMLElement) {
        finishRevealTimeline(revealTimelineRef.current);
        revealTimelineRef.current = animateHistoryRowReveal(lastRow);
      }
    }

    container.scrollTop = container.scrollHeight;
    prevLengthRef.current = state.history.length;
  }, [state.history.length]);

  // Kill any in-progress reveal timeline on unmount.
  useLayoutEffect(() => {
    return () => {
      revealTimelineRef.current?.kill();
    };
  }, []);

  return (
    <section ref={containerRef} className={styles.historyArea} aria-label="Guess history">
      {state.history.map((guess, rowIndex) => (
        <div key={rowIndex} className={styles.row} data-history-row-index={rowIndex}>
          {guess.map((evaluated, colIndex) => (
            <HistoryTile key={colIndex} evaluated={evaluated} />
          ))}
        </div>
      ))}
    </section>
  );
}

function finishRevealTimeline(timeline: ReturnType<typeof animateHistoryRowReveal> | null) {
  // A rapid follow-up submission should not leave the previous row frozen with
  // GSAP's in-progress `from()` styles; snap it to its finished state first.
  timeline?.progress(1).kill();
}
