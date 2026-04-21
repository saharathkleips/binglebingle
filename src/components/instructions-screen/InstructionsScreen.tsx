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

// Full jamo pool for the example word 왜가리.
// 왜 = ㅇ + ㅙ (ㅗ+ㅏ+ㅣ), 가 = ㄱ+ㅏ, 리 = ㄹ+ㅣ
const POOL_JAMO = ["ㅇ", "ㄱ", "ㄹ", "ㅏ", "ㅏ", "ㅏ", "ㅣ", "ㅣ"];

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

        {/* Phase 1: compose */}
        <section className={styles.phase} data-testid="phase-compose">
          <div className={styles.pool}>
            {POOL_JAMO.map((jamo, index) => (
              <span key={index} className={styles.poolTile}>
                {jamo}
              </span>
            ))}
          </div>
          <div className={styles.combineExample}>
            <span className={styles.poolTile}>ㄱ</span>
            <span className={styles.operator}>+</span>
            <span className={styles.poolTile}>ㅏ</span>
            <span className={styles.operator}>=</span>
            <span className={styles.poolTile}>가</span>
          </div>
          <p className={styles.label}>Drag and drop to combine.</p>
          <SlotRow tiles={[{ syllable: "가", result: "present" }, null, null]} />
        </section>

        {/* Phase 2: rotate */}
        <section className={styles.phase} data-testid="phase-rotate">
          <div className={styles.combineExample}>
            <span className={styles.poolTile}>ㅏ</span>
            <span className={styles.operator}>→</span>
            <span className={styles.poolTile}>ㅗ</span>
          </div>
          <p className={styles.label}>Tap to rotate.</p>
          <SlotRow
            tiles={[
              { syllable: "오", result: "absent" },
              { syllable: "가", result: "correct" },
              { syllable: "로", result: "absent" },
            ]}
          />
          <p className={styles.hint}>Guesses don't need to be real words.</p>
        </section>

        {/* Phase 3: deconstruct + final answer */}
        <section className={styles.phase} data-testid="phase-deconstruct">
          <p className={styles.label}>Tap to deconstruct.</p>
          <SlotRow
            tiles={[
              { syllable: "왜", result: "correct" },
              { syllable: "가", result: "correct" },
              { syllable: "리", result: "correct" },
            ]}
          />
        </section>

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

function SlotRow({ tiles }: { tiles: (GuessTile | null)[] }) {
  return (
    <div className={styles.slotRow}>
      {tiles.map((tile, index) =>
        tile === null ? (
          <span key={index} className={styles.emptySlot} />
        ) : (
          <span key={index} className={`${styles.tile} ${styles[tile.result]}`}>
            {tile.syllable}
          </span>
        ),
      )}
    </div>
  );
}
