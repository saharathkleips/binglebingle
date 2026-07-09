/**
 * @file tile-text-overrides.ts
 *
 * Helpers for temporary BaseTile text overrides used by drag previews.
 */

export const DATA_DROP_PREVIEW_ATTRIBUTE = "data-drop-preview";

export function setTileTextOverride(element: Element, text: string | null) {
  if (text === null) {
    clearTileTextOverride(element);
    return;
  }

  const tileTextElement = findTileTextElement(element);
  if (tileTextElement === null) return;

  if (!element.hasAttribute(DATA_TILE_ORIGINAL_TEXT_ATTRIBUTE)) {
    element.setAttribute(DATA_TILE_ORIGINAL_TEXT_ATTRIBUTE, tileTextElement.textContent ?? "");
  }

  tileTextElement.textContent = text;
  element.setAttribute(DATA_DROP_PREVIEW_ATTRIBUTE, text);
}

export function clearTileTextOverride(element: Element) {
  if (!(element instanceof HTMLElement)) return;

  const originalText = element.getAttribute(DATA_TILE_ORIGINAL_TEXT_ATTRIBUTE);
  const tileTextElement = findTileTextElement(element);
  if (originalText !== null && tileTextElement !== null) {
    tileTextElement.textContent = originalText;
  }

  element.removeAttribute(DATA_DROP_PREVIEW_ATTRIBUTE);
  element.removeAttribute(DATA_TILE_ORIGINAL_TEXT_ATTRIBUTE);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATA_TILE_ORIGINAL_TEXT_ATTRIBUTE = "data-drop-original-text";
const TILE_TEXT_SELECTOR = "[data-tile-text]";

function findTileTextElement(element: Element): HTMLElement | null {
  if (!(element instanceof HTMLElement)) return null;
  const tileTextElement = element.querySelector(TILE_TEXT_SELECTOR);
  return tileTextElement instanceof HTMLElement ? tileTextElement : null;
}
