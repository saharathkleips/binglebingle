/**
 * @file WinPanel.tsx
 *
 * Displayed in-place when the player wins. Shows the target word, guess count,
 * and an inert Share button (functionality added in a later milestone).
 */

import { useGame } from "../../context/game/GameContext";
import { calculateScore } from "../../lib/engine/scoring";
import { wordToString } from "../../lib/word";
import styles from "./WinPanel.module.css";

/**
 * Renders the win state: target word, score, and an inert Share placeholder.
 * Must be rendered inside a GameProvider.
 */
export function WinPanel() {
  const { state } = useGame();
  const score = calculateScore(state.history);
  const targetWordString = wordToString(state.targetWord);

  return (
    <div className={styles.winPanel} data-testid="win-panel">
      <p className={styles.message}>정답!</p>
      <p className={styles.targetWord}>{targetWordString}</p>
      <p className={styles.score}>{score.guessCount}번 만에 맞췄어요</p>
      <button type="button" disabled data-testid="share-button">
        Share
      </button>
    </div>
  );
}
