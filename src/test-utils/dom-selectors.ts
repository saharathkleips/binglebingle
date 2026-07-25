import {
  DATA_HISTORY_CARD_ATTRIBUTE,
  DATA_HISTORY_ROW_INDEX_ATTRIBUTE,
  DATA_POOL_ATTRIBUTE,
  DATA_SLOT_HITBOX_ATTRIBUTE,
  DATA_SLOT_INDEX_ATTRIBUTE,
  DATA_TILE_ID_ATTRIBUTE,
  dataAttributeSelector,
} from "../lib/dom-data-attributes";

/** Returns a tile by its production drag/drop data hook. */
export function getTileById(tileId: number): HTMLElement {
  return getRequiredElement(dataAttributeSelector(DATA_TILE_ID_ATTRIBUTE, tileId));
}

/** Returns a tile specifically from the pool surface. */
export function getPoolTile(tileId: number): HTMLElement {
  return getRequiredElement(
    `${dataAttributeSelector(DATA_POOL_ATTRIBUTE, true)} ${dataAttributeSelector(
      DATA_TILE_ID_ATTRIBUTE,
      tileId,
    )}`,
  );
}

/** Returns the filled tile or empty hitbox for a submission slot. */
export function getSubmissionSlot(slotIndex: number): HTMLElement {
  return (
    getOptionalElement(
      `${dataAttributeSelector(DATA_SLOT_INDEX_ATTRIBUTE, slotIndex)}${dataAttributeSelector(
        DATA_TILE_ID_ATTRIBUTE,
      )}`,
    ) ??
    getRequiredElement(
      `${dataAttributeSelector(DATA_SLOT_INDEX_ATTRIBUTE, slotIndex)}${dataAttributeSelector(
        DATA_SLOT_HITBOX_ATTRIBUTE,
      )}`,
    )
  );
}

/** Returns a history row by its semantic row index hook. */
export function getHistoryRow(rowIndex: number): HTMLElement {
  return getRequiredElement(dataAttributeSelector(DATA_HISTORY_ROW_INDEX_ATTRIBUTE, rowIndex));
}

/** Returns all rendered history cards. */
export function getHistoryCards(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll(dataAttributeSelector(DATA_HISTORY_CARD_ATTRIBUTE)),
  ).filter((element): element is HTMLElement => element instanceof HTMLElement);
}

/** Returns an element or throws a test-friendly selector error. */
export function getRequiredElement(selector: string): HTMLElement {
  const element = getOptionalElement(selector);
  if (element === null) {
    throw new Error(`Expected element matching selector: ${selector}`);
  }
  return element;
}

function getOptionalElement(selector: string): HTMLElement | null {
  const element = document.querySelector(selector);
  return element instanceof HTMLElement ? element : null;
}
