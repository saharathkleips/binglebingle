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

const POOL_JAMO = ["ㅇ", "ㄱ", "ㄹ", "ㅏ", "ㅗ", "ㅣ"];

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

        <section className={styles.phase} data-testid="phase-pool">
          <div className={styles.pool}>
            {POOL_JAMO.map((jamo) => (
              <span key={jamo} className={styles.poolTile}>
                {jamo}
              </span>
            ))}
          </div>
          <p className={styles.label}>Use the pool of jamo to guess the word.</p>
          <p className={styles.hint}>Drag and drop to combine.</p>
          <SlotRow tiles={[null, null, null]} />
        </section>

        <section className={styles.phase} data-testid="phase-rotate">
          <div className={styles.rotateExample}>
            <span className={styles.poolTile}>ㅏ</span>
            <span className={styles.arrow}>→</span>
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
          <span key={tile.syllable} className={`${styles.tile} ${styles[tile.result]}`}>
            {tile.syllable}
          </span>
        ),
      )}
    </div>
  );
}
