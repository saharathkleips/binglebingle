import styles from "./InstructionsScreen.module.css";

type InstructionsScreenProps = {
  isOpen: boolean;
  onClose: () => void;
};

type GuessResultKind = "correct" | "present" | "absent";

type GuessTile = {
  syllable: string;
  result: GuessResultKind;
};

/**
 * Full-screen overlay explaining the game mechanic via a worked example.
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
        <p className={styles.intro}>자모를 조합해 음절을 만들고, 단어를 맞혀보세요.</p>

        <ol className={styles.steps}>
          <li className={styles.step} data-testid="step-compose">
            <span className={styles.stepLabel}>자모 조합하기</span>
            <p className={styles.stepDescription}>자모를 드래그해 음절 슬롯에 조합하세요.</p>
            <p className={styles.jamoExample}>
              <span className={styles.jamo}>ㄱ</span>
              <span className={styles.operator}>+</span>
              <span className={styles.jamo}>ㅏ</span>
              <span className={styles.operator}>=</span>
              <span className={styles.jamo}>가</span>
            </p>
            <ExampleRow tiles={[{ syllable: "가", result: "absent" }]} />
          </li>

          <li className={styles.step} data-testid="step-rotate">
            <span className={styles.stepLabel}>자모 회전하기</span>
            <p className={styles.stepDescription}>
              자모를 탭하면 관련된 형태로 바뀝니다. 실제 단어가 아니어도 됩니다.
            </p>
            <p className={styles.jamoExample}>
              <span className={styles.jamo}>ㅏ</span>
              <span className={styles.operator}>→</span>
              <span className={styles.jamo}>ㅗ</span>
            </p>
            <ExampleRow
              tiles={[
                { syllable: "오", result: "absent" },
                { syllable: "가", result: "correct" },
                { syllable: "로", result: "absent" },
              ]}
            />
          </li>

          <li className={styles.step} data-testid="step-answer">
            <span className={styles.stepLabel}>정답!</span>
            <ExampleRow
              tiles={[
                { syllable: "왜", result: "correct" },
                { syllable: "가", result: "correct" },
                { syllable: "리", result: "correct" },
              ]}
            />
          </li>
        </ol>

        <p className={styles.tip} data-testid="decompose-tip">
          실수했다면 음절을 탭해서 분해할 수 있어요.
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

function ExampleRow({ tiles }: { tiles: GuessTile[] }) {
  return (
    <div className={styles.exampleRow}>
      {tiles.map(({ syllable, result }) => (
        <span key={syllable} className={`${styles.tile} ${styles[result]}`}>
          {syllable}
        </span>
      ))}
    </div>
  );
}
