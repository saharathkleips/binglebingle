/**
 * @file use-pool-tile-draggable.ts
 *
 * GSAP Draggable wiring for an interactive pool tile.
 */

import { useRef } from "react";
import { Draggable, gsap, useGSAP } from "../../lib/animation/register";
import { animatePickUp, animateReposition } from "../../lib/animation/drag-animations";
import {
  discardPendingTileSnapBack,
  recordTileSnapBack,
} from "../../lib/animation/snap-back-animations";
import {
  DATA_SLOT_INDEX_ATTRIBUTE,
  DATA_TILE_ID_ATTRIBUTE,
  findDropTarget as findDataAttributeDropTarget,
  findDropTargetTile,
  parseDropTargetNumber,
  removeDropTargetActiveAttributes,
  updateDropTargetHighlight,
} from "../tile/drop-target-helpers";
import { clearTileTextOverride, setTileTextOverride } from "../tile/tile-text-overrides";
import { useLatestRef } from "../tile/use-latest-ref";

export type UsePoolTileDraggableOptions = {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  tileId: number;
  /** Tap is separate from drag; Draggable owns click-vs-drag differentiation. */
  isTappable: boolean;
  onTap: () => void;
  /** Returns false when Pool rejects a pool-tile compose so the source can snap back. */
  onDropOnTile: (targetId: number) => boolean;
  onDropOnSlot: (slotIndex: number) => boolean;
  /** Computes validity and merge-preview text together to avoid duplicate composition work. */
  getDropTargetFeedback: (target: Element) => { canDrop: boolean; preview: string | null };
};

/**
 * Wires GSAP Draggable behavior for a pool tile without owning game rules.
 *
 * @param options - Tile identity, element ref, and Pool-owned interaction callbacks.
 */
export function usePoolTileDraggable({
  buttonRef,
  tileId,
  isTappable,
  onTap,
  onDropOnTile,
  onDropOnSlot,
  getDropTargetFeedback,
}: UsePoolTileDraggableOptions) {
  const lastOverRef = useRef<Element | null>(null);
  const poolOverflowElementRef = useRef<HTMLElement | null>(null);
  const tileIdRef = useLatestRef(tileId);
  const callbacksRef = useLatestRef({
    isTappable,
    onTap,
    onDropOnTile,
    onDropOnSlot,
    getDropTargetFeedback,
  });

  useGSAP(
    () => {
      if (!buttonRef.current) return;

      const sourceElement = buttonRef.current;
      const draggableInstances = Draggable.create(sourceElement, {
        type: "x,y",
        zIndexBoost: true,
        dragClickables: true,
        onDragStart: function onDragStart(this: Draggable) {
          const draggedElement = this.target as HTMLElement;
          poolOverflowElementRef.current = allowPoolDragOverflow(draggedElement);
          animatePickUp(draggedElement);
        },
        onDrag: function onDrag(this: Draggable) {
          updatePoolDragFeedback({
            draggable: this,
            lastOverRef,
            sourceTileId: tileIdRef.current,
            callbacks: callbacksRef.current,
          });
        },
        onDragEnd: function onDragEnd(this: Draggable) {
          const draggedElement = this.target as HTMLElement;
          clearDragFeedback(lastOverRef, draggedElement);

          const dropTarget = getCurrentPoolDropTarget(this, tileIdRef.current);

          // Drop callbacks are authoritative; invalid compose attempts still notify Pool
          // so it can reject the drop before this tile animates back.
          if (
            dropTarget !== null &&
            acceptDrop(dropTarget, draggedElement, tileIdRef.current, callbacksRef.current)
          ) {
            finishAcceptedDrop(draggedElement);
            restorePoolDragOverflow(poolOverflowElementRef);
            return;
          }

          animateReposition(draggedElement, () => restorePoolDragOverflow(poolOverflowElementRef));
        },
        onClick: function onClick() {
          if (callbacksRef.current.isTappable) {
            callbacksRef.current.onTap();
          }
        },
      });

      return () => {
        clearDragFeedback(lastOverRef, sourceElement);
        draggableInstances.forEach((draggableInstance) => draggableInstance.kill());
        restorePoolDragOverflow(poolOverflowElementRef);
      };
    },
    { scope: buttonRef },
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type DropTargetFeedback = { canDrop: boolean; preview: string | null };

type PoolTileCallbacks = Pick<
  UsePoolTileDraggableOptions,
  "onDropOnSlot" | "onDropOnTile" | "getDropTargetFeedback"
>;

type PoolDragFeedbackOptions = {
  draggable: Draggable;
  lastOverRef: React.MutableRefObject<Element | null>;
  sourceTileId: number;
  callbacks: PoolTileCallbacks;
};

const DATA_DROP_SOURCE_ACTIVE_ATTRIBUTE = "data-drop-source-active";
const POOL_SELECTOR = '[data-pool="true"]';
const NO_DROP_FEEDBACK = { canDrop: false, preview: null } satisfies DropTargetFeedback;

function updatePoolDragFeedback({
  draggable,
  lastOverRef,
  sourceTileId,
  callbacks,
}: PoolDragFeedbackOptions) {
  const draggedElement = draggable.target as HTMLElement;
  const dropTarget = getCurrentPoolDropTarget(draggable, sourceTileId);
  const dropTargetFeedback = getFeedbackForDropTarget(dropTarget, callbacks);
  const validDropTarget = dropTargetFeedback.canDrop ? dropTarget : null;

  updateDropTargetHighlight({
    previousTarget: lastOverRef.current,
    nextTarget: validDropTarget,
  });

  updateSourceDragFeedback(draggedElement, validDropTarget, dropTargetFeedback.preview);
  lastOverRef.current = validDropTarget;
}

function getCurrentPoolDropTarget(draggable: Draggable, sourceTileId: number): Element | null {
  const elements = document.elementsFromPoint?.(draggable.pointerX, draggable.pointerY) ?? [];
  return findPoolDropTarget(elements, sourceTileId);
}

function getFeedbackForDropTarget(
  dropTarget: Element | null,
  callbacks: PoolTileCallbacks,
): DropTargetFeedback {
  if (dropTarget === null) return NO_DROP_FEEDBACK;

  return callbacks.getDropTargetFeedback(dropTarget);
}

function updateSourceDragFeedback(
  sourceElement: HTMLElement,
  validDropTarget: Element | null,
  preview: string | null,
) {
  if (validDropTarget === null) {
    sourceElement.removeAttribute(DATA_DROP_SOURCE_ACTIVE_ATTRIBUTE);
    clearTileTextOverride(sourceElement);
    return;
  }

  setTileTextOverride(sourceElement, preview);
  sourceElement.setAttribute(DATA_DROP_SOURCE_ACTIVE_ATTRIBUTE, "true");
}

function findPoolDropTarget(elements: Element[], sourceTileId: number): Element | null {
  return findDataAttributeDropTarget(elements, {
    acceptedAttributes: [DATA_SLOT_INDEX_ATTRIBUTE, DATA_TILE_ID_ATTRIBUTE],
    excludedAttribute: DATA_TILE_ID_ATTRIBUTE,
    excludedValue: String(sourceTileId),
  });
}

function clearDragFeedback(
  lastOverRef: React.MutableRefObject<Element | null>,
  sourceElement: HTMLElement,
) {
  if (lastOverRef.current !== null) removeDropTargetActiveAttributes(lastOverRef.current);
  lastOverRef.current = null;
  sourceElement.removeAttribute(DATA_DROP_SOURCE_ACTIVE_ATTRIBUTE);
  clearTileTextOverride(sourceElement);
}

function acceptDrop(
  dropTarget: Element,
  sourceElement: HTMLElement,
  sourceTileId: number,
  callbacks: PoolTileCallbacks,
): boolean {
  const slotIndex = parseDropTargetNumber(dropTarget, DATA_SLOT_INDEX_ATTRIBUTE);
  if (slotIndex !== null) {
    return acceptSlotDrop({ dropTarget, sourceElement, sourceTileId, slotIndex, callbacks });
  }

  const targetTileId = parseDropTargetNumber(dropTarget, DATA_TILE_ID_ATTRIBUTE);
  if (targetTileId !== null) {
    return callbacks.onDropOnTile(targetTileId);
  }

  return false;
}

type SlotDropOptions = {
  dropTarget: Element;
  sourceElement: HTMLElement;
  sourceTileId: number;
  slotIndex: number;
  callbacks: PoolTileCallbacks;
};

function acceptSlotDrop({
  dropTarget,
  sourceElement,
  sourceTileId,
  slotIndex,
  callbacks,
}: SlotDropOptions): boolean {
  recordTileSnapBack(sourceTileId, sourceElement, { shouldLiftOnArrival: true });
  const displacedTileId = recordDisplacedTileSnapBack(dropTarget);
  const isAccepted = callbacks.onDropOnSlot(slotIndex);
  if (!isAccepted) {
    discardPendingTileSnapBack(sourceTileId);
    if (displacedTileId !== null) discardPendingTileSnapBack(displacedTileId);
  }
  return isAccepted;
}

function recordDisplacedTileSnapBack(dropTarget: Element): number | null {
  const displacedTile = findDropTargetTile(dropTarget);
  if (displacedTile === null) return null;

  recordTileSnapBack(displacedTile.tileId, displacedTile.element);
  return displacedTile.tileId;
}

function finishAcceptedDrop(element: HTMLElement) {
  gsap.set(element, { clearProps: "all" });
}

function allowPoolDragOverflow(sourceElement: HTMLElement): HTMLElement | null {
  const poolElement = sourceElement.closest(POOL_SELECTOR);
  if (!(poolElement instanceof HTMLElement)) return null;

  poolElement.style.overflow = "visible";
  return poolElement;
}

function restorePoolDragOverflow(
  poolOverflowElementRef: React.MutableRefObject<HTMLElement | null>,
) {
  if (poolOverflowElementRef.current !== null) poolOverflowElementRef.current.style.overflow = "";
  poolOverflowElementRef.current = null;
}
