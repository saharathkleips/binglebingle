/**
 * @file HistoryCard.tsx
 *
 * A single revealed card in the guess history, colored by evaluation result.
 */

import { clsx } from "clsx";
import {
  DATA_HISTORY_CARD_ATTRIBUTE,
  DATA_HISTORY_EMPTY_CARD_ATTRIBUTE,
  DATA_RESULT_ATTRIBUTE,
} from "../../lib/dom-data-attributes";
import { getEvaluatedCharacterText } from "../../lib/evaluated-character-display";
import type { EvaluatedCharacter } from "../../lib/engine";
import Inhwi from "../../assets/history-card-inhwi.svg?react";
import {
  HISTORY_CARD_INHWI_BOTTOM_CLASS,
  HISTORY_CARD_INHWI_DECORATED_CLASS,
  HISTORY_CARD_INHWI_TOP_CLASS,
} from "../../lib/history-card-inhwi";
import { Lotus } from "../decoration/Lotus";
import styles from "./HistoryArea.module.css";
import { HistoryCardLayeredText } from "./HistoryCardLayeredText";

/** Props for the `HistoryCard` component. */
export type HistoryCardProps = {
  /** Evaluated character to display, including its result classification. */
  evaluated: EvaluatedCharacter;
  /** Adds the repeating win dance animation, opposite the locked submission row. */
  isWinDanceEnabled?: boolean | undefined;
};

/**
 * Renders a submitted guess card in the history row.
 *
 * History intentionally uses the submission-slot silhouette rather than the
 * draggable tile visual so revealed guesses do not compete with active pieces.
 *
 * @param props - See {@link HistoryCardProps}.
 */
export function HistoryCard({ evaluated, isWinDanceEnabled = false }: HistoryCardProps) {
  const text = getEvaluatedCharacterText(evaluated);
  const winDanceClassName = isWinDanceEnabled && styles.winDanceOpposite;

  if (text === "") {
    return (
      <Lotus
        className={clsx(styles.historyEmptyCard, styles.historyEmptyCardLotus, winDanceClassName)}
        dataAttributes={{
          [DATA_HISTORY_CARD_ATTRIBUTE]: true,
          [DATA_HISTORY_EMPTY_CARD_ATTRIBUTE]: true,
        }}
      />
    );
  }

  return (
    <div
      className={clsx(styles.historyCard, HISTORY_CARD_INHWI_DECORATED_CLASS, winDanceClassName)}
      {...{ [DATA_RESULT_ATTRIBUTE]: evaluated.result, [DATA_HISTORY_CARD_ATTRIBUTE]: true }}
    >
      <Inhwi className={HISTORY_CARD_INHWI_TOP_CLASS} aria-hidden="true" focusable="false" />
      <Inhwi className={HISTORY_CARD_INHWI_BOTTOM_CLASS} aria-hidden="true" focusable="false" />
      <HistoryCardLayeredText text={text} />
    </div>
  );
}
