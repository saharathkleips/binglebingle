/**
 * @file WinPanel.tsx
 *
 * Displayed below the locked winning submission. Shows a compact win summary.
 */

import { useGame } from "../../context/game/GameContext";
import { Button, ButtonText } from "../button/Button";
import { SubmissionButton } from "../submission-area/SubmissionButton";
import { calculateScore } from "../../lib/engine/scoring";
import styles from "./WinPanel.module.css";

/**
 * Renders the win summary details. Must be rendered inside a GameProvider.
 */
export function WinPanel() {
  const { state } = useGame();
  const score = calculateScore(state.history);
  const scoreLabel = `${score.guessCount}번째 시도 성공!`;

  function handleWinCardClick() {
    // TODO: Re-trigger jamo confetti from this card.
  }

  function handleShare() {
    // TODO: Implement share behavior.
  }

  return (
    <section className={styles.winPanel} aria-label="Win summary">
      <Button
        ariaLabel={`정답! ${scoreLabel}`}
        className={styles.winCardButton}
        surfaceClassName={styles.winCardSurface}
        onClick={handleWinCardClick}
      >
        <span className={styles.winCardContent} aria-hidden="true">
          <ButtonText className={styles.answerLabel} isHidden>
            정답!
          </ButtonText>
          <span className={styles.score}>
            <ButtonText className={styles.scoreCount} isHidden>
              {`${score.guessCount}`}
            </ButtonText>
            <ButtonText className={styles.scoreDetail} isHidden>
              번째 시도 성공!
            </ButtonText>
          </span>
        </span>
      </Button>
      <SubmissionButton isDisabled={false} label="공유" onSubmit={handleShare} />
    </section>
  );
}
