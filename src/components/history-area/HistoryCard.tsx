/**
 * @file HistoryCard.tsx
 *
 * A single revealed card in the guess history, colored by evaluation result.
 */

import { resolveCharacter } from "../../lib/character";
import { DATA_HISTORY_CARD_ATTRIBUTE, DATA_RESULT_ATTRIBUTE } from "../../lib/dom-data-attributes";
import type { EvaluatedCharacter } from "../../lib/engine";
import styles from "./HistoryArea.module.css";

/** Props for the `HistoryCard` component. */
export type HistoryCardProps = {
  /** Evaluated character to display, including its result classification. */
  evaluated: EvaluatedCharacter;
};

/**
 * Renders a submitted guess card in the history row.
 *
 * History intentionally uses the submission-slot silhouette rather than the
 * draggable tile visual so revealed guesses do not compete with active pieces.
 *
 * @param props - See {@link HistoryCardProps}.
 */
export function HistoryCard({ evaluated }: HistoryCardProps) {
  const text =
    evaluated.character === undefined ? "" : (resolveCharacter(evaluated.character) ?? "");

  return (
    <div
      className={styles.historyCard}
      {...{ [DATA_RESULT_ATTRIBUTE]: evaluated.result, [DATA_HISTORY_CARD_ATTRIBUTE]: true }}
    >
      <span className={styles.historyCardText}>{text}</span>
    </div>
  );
}
