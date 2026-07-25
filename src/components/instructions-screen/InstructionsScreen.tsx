import type { Character } from "../../lib/character";
import { CharacterTile } from "../tile/CharacterTile";
import styles from "./InstructionsScreen.module.css";

type InstructionsScreenProps = {
  /** Parent-owned visibility keeps the NavBar button and overlay in sync. */
  isOpen: boolean;
  /** Called by either the dismiss button or backdrop click. */
  onClose: () => void;
};

/** Example submission-slot data used by the instructions walkthrough. */
type ExampleSlotCard = {
  /** Character shown in the example guess row. */
  character: Character;
};

// Full jamo pool for the example word 왜가리.
// 왜 = ㅇ + ㅙ (ㅗ+ㅏ+ㅣ), 가 = ㄱ+ㅏ, 리 = ㄹ+ㅣ
const POOL_CHARACTERS = [
  { kind: "CHOSEONG_ONLY", choseong: "ㅇ" },
  { kind: "CHOSEONG_ONLY", choseong: "ㄱ" },
  { kind: "CHOSEONG_ONLY", choseong: "ㄹ" },
  { kind: "JUNGSEONG_ONLY", jungseong: "ㅏ" },
  { kind: "JUNGSEONG_ONLY", jungseong: "ㅏ" },
  { kind: "JUNGSEONG_ONLY", jungseong: "ㅏ" },
  { kind: "JUNGSEONG_ONLY", jungseong: "ㅣ" },
  { kind: "JUNGSEONG_ONLY", jungseong: "ㅣ" },
] satisfies readonly Character[];

const EXAMPLE_CHARACTERS = {
  ㄱ: { kind: "CHOSEONG_ONLY", choseong: "ㄱ" },
  ㄹ: { kind: "CHOSEONG_ONLY", choseong: "ㄹ" },
  ㅏ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅏ" },
  ㅗ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅗ" },
  가: { kind: "OPEN_SYLLABLE", choseong: "ㄱ", jungseong: "ㅏ" },
  오: { kind: "OPEN_SYLLABLE", choseong: "ㅇ", jungseong: "ㅗ" },
  로: { kind: "OPEN_SYLLABLE", choseong: "ㄹ", jungseong: "ㅗ" },
  왜: { kind: "OPEN_SYLLABLE", choseong: "ㅇ", jungseong: "ㅙ" },
  리: { kind: "OPEN_SYLLABLE", choseong: "ㄹ", jungseong: "ㅣ" },
} satisfies Record<string, Character>;

/**
 * Full-screen overlay explaining the game mechanic via a worked example.
 * Parent state controls whether the overlay is shown.
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
    <div className={styles.backdrop} onClick={handleBackdropClick} data-instructions-backdrop>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Game instructions"
        className={styles.card}
        onClick={handleCardClick}
      >
        <h2 className={styles.heading}>어떻게 플레이하나요?</h2>

        {/* Phase 1: compose */}
        <section className={styles.phase} aria-label="Compose phase">
          <div className={styles.pool}>
            {POOL_CHARACTERS.map((character, index) => (
              <CharacterTile
                key={index}
                character={character}
                element="span"
                className={styles.poolTile}
              />
            ))}
          </div>
          <div className={styles.combineExample}>
            <InstructionCharacterTile character={EXAMPLE_CHARACTERS.ㄱ} />
            <span className={styles.operator}>+</span>
            <InstructionCharacterTile character={EXAMPLE_CHARACTERS.ㅏ} />
            <span className={styles.operator}>=</span>
            <InstructionCharacterTile character={EXAMPLE_CHARACTERS.가} />
          </div>
          <p className={styles.label}>Drag and drop to combine.</p>
          <SlotRow tiles={[{ character: EXAMPLE_CHARACTERS.가 }, null, null]} />
        </section>

        {/* Phase 2: rotate */}
        <section className={styles.phase} aria-label="Rotate phase">
          <div className={styles.combineExample}>
            <InstructionCharacterTile character={EXAMPLE_CHARACTERS.ㅏ} />
            <span className={styles.operator}>→</span>
            <InstructionCharacterTile character={EXAMPLE_CHARACTERS.ㅗ} />
          </div>
          <p className={styles.label}>Tap to rotate.</p>
          <SlotRow
            tiles={[
              { character: EXAMPLE_CHARACTERS.오 },
              { character: EXAMPLE_CHARACTERS.가 },
              { character: EXAMPLE_CHARACTERS.로 },
            ]}
          />
          <p className={styles.hint}>Guesses don't need to be real words.</p>
        </section>

        {/* Phase 3: deconstruct + final answer */}
        <section className={styles.phase} aria-label="Deconstruct phase">
          <p className={styles.label}>Tap to deconstruct.</p>
          <SlotRow
            tiles={[
              { character: EXAMPLE_CHARACTERS.왜 },
              { character: EXAMPLE_CHARACTERS.가 },
              { character: EXAMPLE_CHARACTERS.리 },
            ]}
          />
        </section>

        <button className={styles.dismissButton} onClick={onClose}>
          알겠어요!
        </button>
      </div>
    </div>
  );
}

function InstructionCharacterTile({ character }: { character: Character }) {
  return <CharacterTile character={character} element="span" className={styles.poolTile} />;
}

function SlotRow({ tiles }: { tiles: (ExampleSlotCard | null)[] }) {
  return (
    <div className={styles.slotRow}>
      {tiles.map((tile, index) =>
        tile === null ? (
          <span key={index} className={styles.emptySlot} />
        ) : (
          <CharacterTile
            key={index}
            character={tile.character}
            element="span"
            className={styles.slotTile}
          />
        ),
      )}
    </div>
  );
}
