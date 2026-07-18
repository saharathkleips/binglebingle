/** Returns a tile by its production drag/drop data hook. */
export function getTileById(tileId: number): HTMLElement {
  return getRequiredElement(`[data-tile-id="${tileId}"]`);
}

/** Returns a tile specifically from the pool surface. */
export function getPoolTile(tileId: number): HTMLElement {
  return getRequiredElement(`[data-pool="true"] [data-tile-id="${tileId}"]`);
}

/** Returns the filled tile or empty hitbox for a submission slot. */
export function getSubmissionSlot(slotIndex: number): HTMLElement {
  return (
    getOptionalElement(`[data-slot-index="${slotIndex}"][data-tile-id]`) ??
    getRequiredElement(`[data-slot-index="${slotIndex}"][data-slot-hitbox]`)
  );
}

/** Returns a history row by its semantic row index hook. */
export function getHistoryRow(rowIndex: number): HTMLElement {
  return getRequiredElement(`[data-history-row-index="${rowIndex}"]`);
}

/** Returns all rendered history tiles. */
export function getHistoryTiles(): HTMLElement[] {
  return Array.from(document.querySelectorAll("[data-history-tile]")).filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
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
