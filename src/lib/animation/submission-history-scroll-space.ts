/**
 * @file submission-history-scroll-space.ts
 *
 * Helpers for reserving temporary scroll room while a submitted guess reveals
 * into the history viewport.
 */

import { DATA_HISTORY_ANIMATION_SPACER_ATTRIBUTE } from "../dom-data-attributes";

/** Temporary history scroll-space reservation used by submit reveal animation. */
export type ReservedHistoryRowScrollSpace = {
  /** Screen-space top of the temporary history row slot. */
  targetTop: number;
  /** Removes the temporary scroll-space row. */
  restore: () => void;
};

/**
 * Adds a temporary spacer row to history, scrolls it into view, and returns the
 * screen-space target position for incoming reveal cards.
 */
export function reserveHistoryRowScrollSpace(
  historyContainer: HTMLElement | null,
  rowWidth: number,
  rowHeight: number,
  historyRowCount: number,
  fallbackTargetTop: number,
): ReservedHistoryRowScrollSpace {
  if (historyContainer === null) {
    return { targetTop: fallbackTargetTop, restore: () => {} };
  }

  const previousMinHeight = historyContainer.style.minHeight;
  const previousScrollBehavior = historyContainer.style.scrollBehavior;
  historyContainer.style.scrollBehavior = "auto";

  if (historyRowCount === 0) {
    historyContainer.style.minHeight = `${rowHeight}px`;
  }

  let hasRestored = false;
  const spacer = document.createElement("span");
  spacer.setAttribute("aria-hidden", "true");
  spacer.setAttribute(DATA_HISTORY_ANIMATION_SPACER_ATTRIBUTE, "true");
  spacer.style.width = `${rowWidth}px`;
  spacer.style.height = `${rowHeight}px`;
  spacer.style.flex = "none";
  spacer.style.pointerEvents = "none";
  spacer.style.scrollSnapAlign = "end";
  spacer.style.scrollSnapStop = "always";
  historyContainer.appendChild(spacer);

  // Force layout, then scroll the bounded history viewport to the temporary newest row
  // without increasing the history element's own height. This makes room in
  // scroll content instead of pushing the play area off-screen. The spacer also
  // participates in scroll snapping so the browser does not snap back to the
  // previous submitted row.
  void historyContainer.offsetHeight;
  spacer.scrollIntoView({ block: "end", inline: "nearest", behavior: "auto" });
  historyContainer.scrollTop = historyContainer.scrollHeight - historyContainer.clientHeight;

  const targetTop =
    historyRowCount === 0
      ? getVisibleHistoryRowTop(historyContainer, rowHeight, fallbackTargetTop)
      : spacer.getBoundingClientRect().top;

  return {
    targetTop,
    restore: () => {
      if (hasRestored) return;

      hasRestored = true;
      spacer.remove();
      historyContainer.style.minHeight = previousMinHeight;
      historyContainer.scrollTop = historyContainer.scrollHeight - historyContainer.clientHeight;
      historyContainer.style.scrollBehavior = previousScrollBehavior;
    },
  };
}

function getVisibleHistoryRowTop(
  historyContainer: HTMLElement,
  rowHeight: number,
  fallbackTargetTop: number,
): number {
  const containerRect = historyContainer.getBoundingClientRect();
  const computedStyle = getComputedStyle(historyContainer);
  const paddingBlockEnd = Number.parseFloat(computedStyle.paddingBlockEnd) || 0;
  const targetTop = containerRect.bottom - paddingBlockEnd - rowHeight;

  return Number.isFinite(targetTop) ? targetTop : fallbackTargetTop;
}
