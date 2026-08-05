/**
 * @file WinPanel.tsx
 *
 * Displayed below the locked winning submission. Shows a compact win summary.
 */

import { useEffect, useRef } from "react";
import { useGame } from "../../context/game/GameContext";
import { Button, ButtonText } from "../button/Button";
import { SubmissionButton } from "../submission-area/SubmissionButton";
import { triggerJamoConfetti } from "../../lib/animation/jamo-confetti";
import { calculateScore } from "../../lib/engine/scoring";
import { wordToString } from "../../lib/word";
import styles from "./WinPanel.module.css";

const AUTO_CELEBRATED_WIN_STORAGE_PREFIX = "binglebingle:auto-celebrated-win";
const autoCelebratedWinKeys = new Set<string>();

type WinPanelProps = {
  /** Stable daily-game identity used to suppress duplicate automatic celebrations. */
  celebrationScope?: string | undefined;
};

/**
 * Renders the win summary details. Must be rendered inside a GameProvider.
 */
export function WinPanel({ celebrationScope = "standalone" }: WinPanelProps = {}) {
  const { state } = useGame();
  const winCardButtonRef = useRef<HTMLButtonElement>(null);
  const score = calculateScore(state.history);
  const scoreLabel = `${score.guessCount}번째 시도 성공!`;
  const winKey = `${celebrationScope}:${wordToString(state.targetWord)}:${state.history.length}`;

  useEffect(() => {
    if (hasAutoCelebratedWin(winKey)) return undefined;

    markAutoCelebratedWin(winKey);
    return triggerElementConfetti(winCardButtonRef.current);
  }, [winKey]);

  function handleWinCardClick() {
    triggerElementConfetti(winCardButtonRef.current);
  }

  function handleShare() {
    // TODO: Implement share behavior.
  }

  return (
    <section className={styles.winPanel} aria-label="성공 결과">
      <Button
        ariaLabel={`정답! ${scoreLabel}`}
        ref={winCardButtonRef}
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

function hasAutoCelebratedWin(winKey: string): boolean {
  if (autoCelebratedWinKeys.has(winKey)) return true;

  const storage = getLocalStorage();
  return storage?.getItem(autoCelebratedWinStorageKey(winKey)) === "true";
}

function markAutoCelebratedWin(winKey: string): void {
  autoCelebratedWinKeys.add(winKey);

  const storage = getLocalStorage();
  try {
    storage?.setItem(autoCelebratedWinStorageKey(winKey), "true");
  } catch {
    // Ignore storage failures; in-memory suppression still handles remounts in this session.
  }
}

function autoCelebratedWinStorageKey(winKey: string): string {
  return `${AUTO_CELEBRATED_WIN_STORAGE_PREFIX}:${winKey}`;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function triggerElementConfetti(element: HTMLElement | null): (() => void) | undefined {
  if (element === null) return undefined;
  return triggerJamoConfetti({ originElement: element });
}
