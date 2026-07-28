import type { Character } from "../../lib/character";
import type { EvaluatedCharacter } from "../../lib/engine";
import { Lotus } from "../decoration/Lotus";
import { HistoryCard } from "../history-area/HistoryCard";
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

// Full jamo pool for the example answer 왜가리.
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
  ㅇ: { kind: "CHOSEONG_ONLY", choseong: "ㅇ" },
  ㅏ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅏ" },
  ㅗ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅗ" },
  ㅜ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅜ" },
  ㅓ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅓ" },
  ㅘ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅘ" },
  ㅙ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅙ" },
  ㅣ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅣ" },
  가: { kind: "OPEN_SYLLABLE", choseong: "ㄱ", jungseong: "ㅏ" },
  라: { kind: "OPEN_SYLLABLE", choseong: "ㄹ", jungseong: "ㅏ" },
  왜: { kind: "OPEN_SYLLABLE", choseong: "ㅇ", jungseong: "ㅙ" },
  리: { kind: "OPEN_SYLLABLE", choseong: "ㄹ", jungseong: "ㅣ" },
} satisfies Record<string, Character>;

const INCOMPLETE_GUESS_RESULT = [
  { character: EXAMPLE_CHARACTERS.라, result: "ABSENT" },
  { result: "ABSENT" },
  { character: EXAMPLE_CHARACTERS.왜, result: "PRESENT" },
] satisfies readonly EvaluatedCharacter[];

const FINAL_GUESS_RESULT = [
  { character: EXAMPLE_CHARACTERS.왜, result: "CORRECT" },
  { character: EXAMPLE_CHARACTERS.가, result: "CORRECT" },
  { character: EXAMPLE_CHARACTERS.리, result: "CORRECT" },
] satisfies readonly EvaluatedCharacter[];

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
        aria-label="게임 방법"
        className={styles.card}
        onClick={handleCardClick}
      >
        <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
          ×
        </button>

        <header className={styles.header}>
          {/* Spin the jamo pieces round and round to find the hidden word! */}
          <p className={styles.lede}>자모 조각을 빙글빙글 돌려 숨은 낱말을 찾아요!</p>
          <div className={styles.pool} aria-label="처음 자모 조각">
            {POOL_CHARACTERS.map((character, index) => (
              <CharacterTile
                key={index}
                character={character}
                element="span"
                className={styles.poolTile}
              />
            ))}
          </div>
        </header>

        <section className={styles.instructionSection} aria-label="글자 만들기">
          {/* Rotate, snap together, and new syllables appear. */}
          <p className={styles.label}>돌리고 착! 합치면 새 글자가 돼요.</p>
          <InstructionEquation
            characters={[
              EXAMPLE_CHARACTERS.ㅏ,
              EXAMPLE_CHARACTERS.ㅜ,
              EXAMPLE_CHARACTERS.ㅓ,
              EXAMPLE_CHARACTERS.ㅗ,
            ]}
            operators={["→", "→", "→"]}
          />
          <InstructionEquation
            characters={[
              EXAMPLE_CHARACTERS.ㅗ,
              EXAMPLE_CHARACTERS.ㅏ,
              EXAMPLE_CHARACTERS.ㅘ,
              EXAMPLE_CHARACTERS.ㅣ,
              EXAMPLE_CHARACTERS.ㅙ,
            ]}
            operators={["+", "=", "+", "="]}
          />

          <InstructionEquation
            characters={[EXAMPLE_CHARACTERS.ㅇ, EXAMPLE_CHARACTERS.ㅙ, EXAMPLE_CHARACTERS.왜]}
            operators={["+", "="]}
          />
        </section>

        <section className={styles.instructionSection} aria-label="추측 제출">
          {/* Empty slots are okay! Submit to reveal clues. */}
          <p className={styles.label}>빈칸도 괜찮아요! 제출하면 단서가 나와요.</p>
          <div className={styles.submissionRevealExample}>
            <SlotRow
              tiles={[
                { character: EXAMPLE_CHARACTERS.라 },
                null,
                { character: EXAMPLE_CHARACTERS.왜 },
              ]}
            />
            <div className={styles.downArrow} aria-hidden="true">
              ↓
            </div>
            <ResultRow results={INCOMPLETE_GUESS_RESULT} />
          </div>
          <dl className={styles.legend}>
            <div className={styles.legendItem}>
              {/* Green: exactly right. */}
              <dt>초록</dt>
              <dd>딱 맞아요</dd>
            </div>
            <div className={styles.legendItem}>
              {/* Yellow: the position is different. */}
              <dt>노랑</dt>
              <dd>자리가 달라요</dd>
            </div>
            <div className={styles.legendItem}>
              {/* Gray: not in the word. */}
              <dt>회색</dt>
              <dd>낱말에 없어요</dd>
            </div>
          </dl>
        </section>

        <section className={styles.instructionSection} aria-label="성공">
          <ResultRow results={FINAL_GUESS_RESULT} />
          {/* Turn every slot green to win! */}
          <p className={styles.label}>모든 칸이 초록이면 성공이에요!</p>
        </section>
      </div>
    </div>
  );
}

function InstructionEquation({
  characters,
  operators,
}: {
  characters: readonly Character[];
  operators: readonly string[];
}) {
  return (
    <div className={styles.equation}>
      {characters.map((character, index) => (
        <span key={index} className={styles.equationItem}>
          {index > 0 ? <span className={styles.operator}>{operators[index - 1]}</span> : null}
          <InstructionCharacterTile character={character} />
        </span>
      ))}
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
          <span key={index} className={styles.emptySlot} aria-label="빈칸">
            <Lotus />
          </span>
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

function ResultRow({ results }: { results: readonly EvaluatedCharacter[] }) {
  return (
    <div className={styles.resultRow}>
      {results.map((evaluated, index) => (
        <HistoryCard key={index} evaluated={evaluated} />
      ))}
    </div>
  );
}
