export function getTileById(tileId: number): HTMLElement {
  return getRequiredElement(`[data-tile-id="${tileId}"]`);
}

export function getPoolTile(tileId: number): HTMLElement {
  return getRequiredElement(`[data-pool="true"] [data-tile-id="${tileId}"]`);
}

export function getSubmissionSlot(slotIndex: number): HTMLElement {
  return (
    getOptionalElement(`[data-slot-index="${slotIndex}"][data-tile-id]`) ??
    getRequiredElement(`[data-slot-index="${slotIndex}"][data-slot-hitbox]`)
  );
}

export function getHistoryRow(rowIndex: number): HTMLElement {
  return getRequiredElement(`[data-history-row-index="${rowIndex}"]`);
}

export function getHistoryTiles(): HTMLElement[] {
  return Array.from(document.querySelectorAll("[data-history-tile]")).filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
}

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
