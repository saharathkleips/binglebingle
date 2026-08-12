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
  DATA_DROP_SOURCE_ACTIVE_ATTRIBUTE,
  DATA_POOL_ATTRIBUTE,
  DATA_POOL_TILE_HITBOX_ID_ATTRIBUTE,
  DATA_SLOT_INDEX_ATTRIBUTE,
  DATA_TILE_ID_ATTRIBUTE,
  dataAttributeSelector,
} from "../../lib/dom-data-attributes";
import {
  findDropTarget as findDataAttributeDropTarget,
  findDropTargetTile,
  parseDropTargetNumber,
  removeDropTargetActiveAttributes,
  updateDropTargetHighlight,
} from "../tile/drop-target-helpers";
import { clearTileTextOverride, setTileTextOverride } from "../tile/tile-text-overrides";
import { useLatestRef } from "../tile/use-latest-ref";

/** Options for wiring draggable behavior on a rendered pool tile. */
export type UsePoolTileDraggableOptions = {
  /** Ref to the pool tile button that GSAP Draggable should own. */
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  /** Stable game tile ID used for drop self-exclusion and snap-back lookup. */
  tileId: number;
  /** Tap is separate from drag; Draggable owns click-vs-drag differentiation. */
  isTappable: boolean;
  /** Called when Draggable resolves the pointer sequence as a tap. */
  onTap: (sourceElement: HTMLElement) => void;
  /** Returns false when Pool rejects a pool-tile compose so the source can snap back. */
  onDropOnTile: (targetId: number) => boolean;
  /** Called when the drag is released on a submission slot. Returns whether the drop was accepted. */
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
  const sourceStartRectRef = useRef<DOMRect | null>(null);
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
          sourceStartRectRef.current = draggedElement.getBoundingClientRect();
          poolOverflowElementRef.current = allowPoolDragOverflow(draggedElement);
          animatePickUp(draggedElement);
        },
        onDrag: function onDrag(this: Draggable) {
          updatePoolDragFeedback({
            draggable: this,
            lastOverRef,
            sourceStartRect: sourceStartRectRef.current,
            sourceTileId: tileIdRef.current,
            callbacks: callbacksRef.current,
          });
        },
        onDragEnd: function onDragEnd(this: Draggable) {
          const draggedElement = this.target as HTMLElement;
          clearDragFeedback(lastOverRef, draggedElement);

          const dropTarget = getCurrentPoolDropTarget(
            this,
            tileIdRef.current,
            sourceStartRectRef.current,
          );
          sourceStartRectRef.current = null;

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
            callbacksRef.current.onTap(sourceElement);
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

type DropTargetFeedback = {
  /** Whether the current target accepts the dragged pool tile. */
  canDrop: boolean;
  /** Temporary text to render on the source tile while hovering a valid compose target. */
  preview: string | null;
};

type PoolTileCallbacks = Pick<
  UsePoolTileDraggableOptions,
  "onDropOnSlot" | "onDropOnTile" | "getDropTargetFeedback"
>;

type PoolDragFeedbackOptions = {
  /** Active Draggable instance for the source tile. */
  draggable: Draggable;
  /** Last highlighted drop target so feedback can be moved or cleared. */
  lastOverRef: React.MutableRefObject<Element | null>;
  /** Source tile rect captured before Draggable transforms it. */
  sourceStartRect: DOMRect | null;
  /** Stable ID of the dragged source tile. */
  sourceTileId: number;
  /** Pool-owned drop and feedback callbacks. */
  callbacks: PoolTileCallbacks;
};

const POOL_SELECTOR = `[${DATA_POOL_ATTRIBUTE}="true"]`;
const POOL_TILE_OVERLAP_DROP_RATIO = 0.5;
const NO_DROP_FEEDBACK = { canDrop: false, preview: null } satisfies DropTargetFeedback;

function updatePoolDragFeedback({
  draggable,
  lastOverRef,
  sourceStartRect,
  sourceTileId,
  callbacks,
}: PoolDragFeedbackOptions) {
  const draggedElement = draggable.target as HTMLElement;
  const dropTarget = getCurrentPoolDropTarget(draggable, sourceTileId, sourceStartRect);
  const dropTargetFeedback = getFeedbackForDropTarget(dropTarget, callbacks);
  const validDropTarget = dropTargetFeedback.canDrop ? dropTarget : null;

  updateDropTargetHighlight({
    previousTarget: lastOverRef.current,
    nextTarget: validDropTarget,
  });

  updateSourceDragFeedback(draggedElement, validDropTarget, dropTargetFeedback.preview);
  lastOverRef.current = validDropTarget;
}

function getCurrentPoolDropTarget(
  draggable: Draggable,
  sourceTileId: number,
  sourceStartRect: DOMRect | null,
): Element | null {
  const elements = document.elementsFromPoint?.(draggable.pointerX, draggable.pointerY) ?? [];
  const pointerDropTarget = findPoolDropTarget(elements, sourceTileId);
  if (pointerDropTarget !== null) return pointerDropTarget;

  return findOverlappingPoolTileDropTarget(
    getTranslatedRect(draggable.target as HTMLElement, sourceStartRect, draggable.x, draggable.y),
    sourceTileId,
  );
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
    acceptedAttributes: [
      DATA_SLOT_INDEX_ATTRIBUTE,
      DATA_TILE_ID_ATTRIBUTE,
      DATA_POOL_TILE_HITBOX_ID_ATTRIBUTE,
    ],
    excludedAttributes: [DATA_TILE_ID_ATTRIBUTE, DATA_POOL_TILE_HITBOX_ID_ATTRIBUTE],
    excludedValue: String(sourceTileId),
  });
}

function findOverlappingPoolTileDropTarget(
  sourceRect: DOMRect,
  sourceTileId: number,
): Element | null {
  const sourceArea = sourceRect.width * sourceRect.height;
  if (sourceArea <= 0) return null;

  const candidates = document.querySelectorAll(
    dataAttributeSelector(DATA_POOL_TILE_HITBOX_ID_ATTRIBUTE),
  );
  let bestTarget: Element | null = null;
  let bestOverlapArea = 0;

  candidates.forEach((candidate) => {
    if (!(candidate instanceof HTMLElement)) return;
    if (candidate.getAttribute(DATA_POOL_TILE_HITBOX_ID_ATTRIBUTE) === String(sourceTileId)) return;

    const candidateRect = candidate.getBoundingClientRect();
    const candidateArea = candidateRect.width * candidateRect.height;
    const overlapArea = getRectIntersectionArea(sourceRect, candidateRect);
    const normalizedOverlapArea = overlapArea / Math.min(sourceArea, candidateArea);
    if (normalizedOverlapArea > bestOverlapArea) {
      bestTarget = candidate;
      bestOverlapArea = normalizedOverlapArea;
    }
  });

  return bestOverlapArea >= POOL_TILE_OVERLAP_DROP_RATIO ? bestTarget : null;
}

function getTranslatedRect(
  sourceElement: HTMLElement,
  sourceStartRect: DOMRect | null,
  x: number,
  y: number,
): DOMRect {
  if (sourceStartRect === null) return sourceElement.getBoundingClientRect();

  return new DOMRect(
    sourceStartRect.x + x,
    sourceStartRect.y + y,
    sourceStartRect.width,
    sourceStartRect.height,
  );
}

function getRectIntersectionArea(firstRect: DOMRect, secondRect: DOMRect): number {
  const width = Math.max(
    0,
    Math.min(firstRect.right, secondRect.right) - Math.max(firstRect.left, secondRect.left),
  );
  const height = Math.max(
    0,
    Math.min(firstRect.bottom, secondRect.bottom) - Math.max(firstRect.top, secondRect.top),
  );
  return width * height;
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

  const targetTile = findDropTargetTile(dropTarget);
  if (targetTile !== null) {
    return callbacks.onDropOnTile(targetTile.tileId);
  }

  return false;
}

type SlotDropOptions = {
  /** Submission slot drop target element. */
  dropTarget: Element;
  /** Dragged pool tile element. */
  sourceElement: HTMLElement;
  /** Stable ID of the dragged source tile. */
  sourceTileId: number;
  /** Destination submission slot index. */
  slotIndex: number;
  /** Pool-owned drop callbacks. */
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
