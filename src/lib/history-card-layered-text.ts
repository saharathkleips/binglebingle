/**
 * @file history-card-layered-text.ts
 *
 * Shared DOM contract for stroked/depth-layered history-card text.
 */

/** Global class for the layered text wrapper used by history cards and reveal clones. */
export const HISTORY_CARD_LAYERED_TEXT_CLASS = "history-card-layered-text";
/** Global class for the decorative depth layer below the visible history-card text. */
export const HISTORY_CARD_LAYERED_TEXT_DEPTH_CLASS = "history-card-layered-text-depth";
/** Global class for the decorative outline layer below the visible history-card text. */
export const HISTORY_CARD_LAYERED_TEXT_OUTLINE_CLASS = "history-card-layered-text-outline";
/** Global class for the visible text label above decorative outline/depth layers. */
export const HISTORY_CARD_LAYERED_TEXT_LABEL_CLASS = "history-card-layered-text-label";

/** Creates the shared layered-text DOM structure for imperative animation clones. */
export function createHistoryCardLayeredTextElement(text: string): HTMLSpanElement {
  const textElement = document.createElement("span");
  textElement.className = HISTORY_CARD_LAYERED_TEXT_CLASS;

  const depthElement = document.createElement("span");
  depthElement.className = HISTORY_CARD_LAYERED_TEXT_DEPTH_CLASS;
  depthElement.setAttribute("aria-hidden", "true");
  depthElement.textContent = text;

  const outlineElement = document.createElement("span");
  outlineElement.className = HISTORY_CARD_LAYERED_TEXT_OUTLINE_CLASS;
  outlineElement.setAttribute("aria-hidden", "true");
  outlineElement.textContent = text;

  const labelElement = document.createElement("span");
  labelElement.className = HISTORY_CARD_LAYERED_TEXT_LABEL_CLASS;
  labelElement.textContent = text;

  textElement.replaceChildren(depthElement, outlineElement, labelElement);

  return textElement;
}
