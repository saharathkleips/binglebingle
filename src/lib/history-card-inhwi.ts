/**
 * @file history-card-inhwi.ts
 *
 * Shared DOM contract for the decorative Inhwi motif used by history cards.
 */

import inhwiSvgMarkup from "../assets/history-card-inhwi.svg?raw";

/** Global class for history cards that render the Inhwi motif. */
export const HISTORY_CARD_INHWI_DECORATED_CLASS = "history-card-inhwi-decorated";
/** Global class for the top Inhwi motif on history cards and reveal clones. */
export const HISTORY_CARD_INHWI_TOP_CLASS = "history-card-inhwi-top";
/** Global class for the bottom, vertically flipped Inhwi motif on history cards and reveal clones. */
export const HISTORY_CARD_INHWI_BOTTOM_CLASS = "history-card-inhwi-bottom";

let historyCardInhwiTemplate: HTMLTemplateElement | undefined;

/** Creates an inline Inhwi SVG element so CSS color variables inherit from its card. */
export function createHistoryCardInhwiElement(className: string): SVGElement {
  historyCardInhwiTemplate ??= createHistoryCardInhwiTemplate();

  const element = historyCardInhwiTemplate.content.firstElementChild?.cloneNode(true);
  if (!(element instanceof SVGElement)) {
    throw new Error("Expected Inhwi SVG markup to create an SVG element.");
  }

  element.classList.add(className);
  element.setAttribute("aria-hidden", "true");
  element.setAttribute("focusable", "false");

  return element;
}

function createHistoryCardInhwiTemplate(): HTMLTemplateElement {
  const template = document.createElement("template");
  template.innerHTML = inhwiSvgMarkup.trim();
  return template;
}
