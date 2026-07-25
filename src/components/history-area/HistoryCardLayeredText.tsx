/**
 * @file HistoryCardLayeredText.tsx
 *
 * Decorative stroked/depth-layered text used by revealed history cards.
 */

import {
  HISTORY_CARD_LAYERED_TEXT_CLASS,
  HISTORY_CARD_LAYERED_TEXT_DEPTH_CLASS,
  HISTORY_CARD_LAYERED_TEXT_LABEL_CLASS,
  HISTORY_CARD_LAYERED_TEXT_OUTLINE_CLASS,
} from "../../lib/history-card-layered-text";

/** Props for the `HistoryCardLayeredText` component. */
export type HistoryCardLayeredTextProps = {
  /** Visible text to layer with decorative depth and outline copies. */
  text: string;
};

/** Renders accessible history-card text with aria-hidden decorative layers. */
export function HistoryCardLayeredText({ text }: HistoryCardLayeredTextProps) {
  return (
    <span className={HISTORY_CARD_LAYERED_TEXT_CLASS}>
      <span className={HISTORY_CARD_LAYERED_TEXT_DEPTH_CLASS} aria-hidden="true">
        {text}
      </span>
      <span className={HISTORY_CARD_LAYERED_TEXT_OUTLINE_CLASS} aria-hidden="true">
        {text}
      </span>
      <span className={HISTORY_CARD_LAYERED_TEXT_LABEL_CLASS}>{text}</span>
    </span>
  );
}
