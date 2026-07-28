/**
 * @file WinPanel.tsx
 *
 * Displayed in-place when the player wins. Shows the target word, guess count,
 * and share action.
 */

import { useGame } from "../../context/game/GameContext";
import { SubmissionButton } from "../submission-area/SubmissionButton";
import { calculateScore } from "../../lib/engine/scoring";
import { wordToString } from "../../lib/word";
import styles from "./WinPanel.module.css";

/**
 * Renders the win state: target word, score, and share action.
 * Must be rendered inside a GameProvider.
 */
export function WinPanel() {
  const { state } = useGame();
  const score = calculateScore(state.history);
  const targetWordString = wordToString(state.targetWord);

  function handleShare() {
    // TODO: Implement share behavior.
  }

  return (
    <section className={styles.winPanel} aria-label="Win summary">
      <p className={styles.message}>정답!</p>
      <p className={styles.targetWord}>{targetWordString}</p>
      <p className={styles.score}>{score.guessCount}번 만에 맞췄어요</p>
      <SubmissionButton isDisabled={false} label="공유" onSubmit={handleShare} />
    </section>
  );
}
