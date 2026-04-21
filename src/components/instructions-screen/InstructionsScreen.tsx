import styles from "./InstructionsScreen.module.css";

type InstructionsScreenProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Full-screen overlay explaining the rotate → combine → compose mechanic.
 * Shown on first load and reopenable via the NavBar "?" button.
 *
 * @param isOpen - Whether the overlay is visible.
 * @param onClose - Called when the player dismisses the overlay.
 * @returns The rendered overlay, or null when closed.
 */
export function InstructionsScreen({ isOpen, onClose }: InstructionsScreenProps) {
  if (!isOpen) return null;

  function handleBackdropClick() {
    onClose();
  }

  function handleCardClick(event: React.MouseEvent) {
    // Prevent backdrop handler from firing when clicking inside the card
    event.stopPropagation();
  }

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      data-testid="instructions-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Game instructions"
        className={styles.card}
        onClick={handleCardClick}
        data-testid="instructions-screen"
      >
        <h2 className={styles.heading}>어떻게 플레이하나요?</h2>

        <ol className={styles.steps}>
          <li className={styles.step}>
            <span className={styles.stepLabel}>1. 회전 (Rotate)</span>
            <p className={styles.stepDescription}>자모를 회전하면 관련된 다른 자모로 바뀝니다.</p>
            <p className={styles.example}>
              <span className={styles.jamo}>ㄱ</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.jamo}>ㄴ</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.jamo}>ㄷ</span>
            </p>
          </li>

          <li className={styles.step}>
            <span className={styles.stepLabel}>2. 결합 (Combine)</span>
            <p className={styles.stepDescription}>
              같은 종류의 자모 두 개를 합치면 복합 자모가 됩니다.
            </p>
            <p className={styles.example}>
              <span className={styles.jamo}>ㄱ</span>
              <span className={styles.plus}>+</span>
              <span className={styles.jamo}>ㄱ</span>
              <span className={styles.arrow}>=</span>
              <span className={styles.jamo}>ㄲ</span>
              <span className={styles.separator}>·</span>
              <span className={styles.jamo}>ㅗ</span>
              <span className={styles.plus}>+</span>
              <span className={styles.jamo}>ㅏ</span>
              <span className={styles.arrow}>=</span>
              <span className={styles.jamo}>ㅘ</span>
            </p>
          </li>

          <li className={styles.step}>
            <span className={styles.stepLabel}>3. 조합 (Compose)</span>
            <p className={styles.stepDescription}>
              초성과 중성(그리고 선택적 종성)을 합쳐서 음절을 만드세요.
            </p>
            <p className={styles.example}>
              <span className={styles.jamo}>ㅂ</span>
              <span className={styles.plus}>+</span>
              <span className={styles.jamo}>ㅏ</span>
              <span className={styles.plus}>+</span>
              <span className={styles.jamo}>ㅂ</span>
              <span className={styles.arrow}>=</span>
              <span className={styles.syllable}>밥</span>
            </p>
          </li>
        </ol>

        <p className={styles.goal}>
          자모 풀에서 음절을 만들어 단어를 맞혀보세요. 각 글자는 <strong>정확</strong>,{" "}
          <strong>존재</strong>, <strong>없음</strong>으로 평가됩니다.
        </p>

        <button
          className={styles.dismissButton}
          onClick={onClose}
          data-testid="instructions-dismiss"
        >
          알겠어요!
        </button>
      </div>
    </div>
  );
}
