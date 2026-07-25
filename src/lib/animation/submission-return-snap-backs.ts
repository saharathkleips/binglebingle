/**
 * @file submission-return-snap-backs.ts
 *
 * Records snap-back animations for submitted tiles that decompose and return to
 * the pool after an absent guess result.
 */

import type { ReturnedTilesForSlot } from "../../context/game/round-actions";
import { resolveCharacter } from "../character";
import {
  DATA_SLOT_INDEX_ATTRIBUTE,
  DATA_TILE_ID_ATTRIBUTE,
  dataAttributeSelector,
} from "../dom-data-attributes";
import { RETURN_TO_POOL_AFTER_SUBMISSION_TIMING } from "./motion-tokens";
import { recordTileSnapBack } from "./snap-back-animations";

/**
 * Records pending snap-back clones for submitted tiles that return to the pool.
 *
 * The source slot tile is hidden after its clones are captured so the later
 * React commit can remove the tile without a visual double-exposure.
 */
export function recordSubmissionReturnSnapBacks(
  returnedTilesBySlot: readonly ReturnedTilesForSlot[],
  slotsContainer: HTMLElement,
): void {
  let returnIndex = 0;

  returnedTilesBySlot.forEach(({ slotIndex, tiles }) => {
    const sourceElement = findFilledSlotTileElement(slotsContainer, slotIndex);
    if (sourceElement === null) return;

    tiles.forEach((tile, partIndex) => {
      recordTileSnapBack(tile.id, sourceElement, {
        cloneText: resolveCharacter(tile.character) ?? "",
        cloneTextTiming: partIndex === 0 ? "on-start" : "immediate",
        delay:
          RETURN_TO_POOL_AFTER_SUBMISSION_TIMING.startDelay +
          returnIndex * RETURN_TO_POOL_AFTER_SUBMISSION_TIMING.stagger,
        initialVisibility: partIndex === 0 ? "visible" : "hidden-until-start",
      });
      returnIndex += 1;
    });

    sourceElement.style.visibility = "hidden";
  });
}

function findFilledSlotTileElement(
  slotsContainer: HTMLElement,
  slotIndex: number,
): HTMLElement | null {
  return slotsContainer.querySelector<HTMLElement>(
    `${dataAttributeSelector(DATA_SLOT_INDEX_ATTRIBUTE, slotIndex)}${dataAttributeSelector(
      DATA_TILE_ID_ATTRIBUTE,
    )}`,
  );
}
