/**
 * @file use-pool-tile-draggable.ts
 *
 * GSAP Draggable wiring for an interactive pool tile.
 */

import { useRef } from "react";
import { Draggable, gsap, useGSAP } from "../../lib/animation/register";
import { animatePickUp, animateReposition } from "../../lib/animation/drag-animations";
import {
  DATA_SLOT_INDEX_ATTRIBUTE,
  DATA_TILE_ID_ATTRIBUTE,
  findDropTarget as findDataAttributeDropTarget,
  removeDropTargetActiveAttributes,
  updateDropTargetHighlight,
} from "../tile/drop-target-helpers";
import { clearTileTextOverride, setTileTextOverride } from "../tile/tile-text-overrides";
import { useLatestRef } from "../tile/use-latest-ref";

export type UsePoolTileDraggableOptions = {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  tileId: number;
  isTappable: boolean;
  onTap: () => void;
  onDropOnTile: (targetId: number) => void;
  onDropOnSlot: (slotIndex: number) => void;
  canDropOnTarget: ((target: Element) => boolean) | undefined;
  getDropPreview: ((target: Element) => string | null) | undefined;
};

export function usePoolTileDraggable({
  buttonRef,
  tileId,
  isTappable,
  onTap,
  onDropOnTile,
  onDropOnSlot,
  canDropOnTarget,
  getDropPreview,
}: UsePoolTileDraggableOptions) {
  const lastOverRef = useRef<Element | null>(null);
  const tileIdRef = useLatestRef(tileId);
  const callbacksRef = useLatestRef({
    isTappable,
    onTap,
    onDropOnTile,
    onDropOnSlot,
    canDropOnTarget,
    getDropPreview,
  });

  useGSAP(
    () => {
      if (!buttonRef.current) return;

      Draggable.create(buttonRef.current, {
        type: "x,y",
        zIndexBoost: true,
        dragClickables: true,
        onDragStart: function onDragStart(this: Draggable) {
          allowPoolDragOverflow();
          animatePickUp(this.target as HTMLElement);
        },
        onDrag: function onDrag(this: Draggable) {
          const elements = document.elementsFromPoint?.(this.pointerX, this.pointerY) ?? [];
          const dropTarget = findPoolDropTarget(elements, tileIdRef.current);
          const { canDropOnTarget: canDrop, getDropPreview: getPreview } = callbacksRef.current;
          const isValidDrop = dropTarget !== null && (canDrop === undefined || canDrop(dropTarget));
          const sourceElement = this.target as HTMLElement;

          updateDropTargetHighlight({
            previousTarget: lastOverRef.current,
            nextTarget: isValidDrop ? dropTarget : null,
          });

          if (isValidDrop && dropTarget !== null) {
            setTileTextOverride(sourceElement, getPreview?.(dropTarget) ?? null);
            sourceElement.setAttribute(DATA_DROP_SOURCE_ACTIVE_ATTRIBUTE, "true");
          } else {
            sourceElement.removeAttribute(DATA_DROP_SOURCE_ACTIVE_ATTRIBUTE);
            clearTileTextOverride(sourceElement);
          }
          lastOverRef.current = isValidDrop ? dropTarget : null;
        },
        onDragEnd: function onDragEnd(this: Draggable) {
          clearDragFeedback(lastOverRef, this.target as HTMLElement);

          const element = this.target as HTMLElement;
          const elements = document.elementsFromPoint?.(this.pointerX, this.pointerY) ?? [];
          const dropTarget = findPoolDropTarget(elements, tileIdRef.current);

          if (dropTarget !== null && dispatchDrop(dropTarget, callbacksRef.current)) {
            gsap.set(element, { clearProps: "all" });
            restorePoolDragOverflow();
            return;
          }

          animateReposition(element, restorePoolDragOverflow);
        },
        onClick: function onClick() {
          if (callbacksRef.current.isTappable) {
            callbacksRef.current.onTap();
          }
        },
      });
    },
    { scope: buttonRef },
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PoolTileCallbacks = Pick<UsePoolTileDraggableOptions, "onDropOnSlot" | "onDropOnTile">;

const DATA_DROP_SOURCE_ACTIVE_ATTRIBUTE = "data-drop-source-active";
const POOL_SELECTOR = '[data-testid="pool"]';

function findPoolDropTarget(elements: Element[], selfTileId: number): Element | null {
  return findDataAttributeDropTarget(elements, {
    acceptedAttributes: [DATA_SLOT_INDEX_ATTRIBUTE, DATA_TILE_ID_ATTRIBUTE],
    excludedAttribute: DATA_TILE_ID_ATTRIBUTE,
    excludedValue: String(selfTileId),
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

function dispatchDrop(dropTarget: Element, callbacks: PoolTileCallbacks): boolean {
  const slotIndex = parseDropTargetNumber(dropTarget, DATA_SLOT_INDEX_ATTRIBUTE);
  if (slotIndex !== null) {
    callbacks.onDropOnSlot(slotIndex);
    return true;
  }

  const targetTileId = parseDropTargetNumber(dropTarget, DATA_TILE_ID_ATTRIBUTE);
  if (targetTileId !== null) {
    callbacks.onDropOnTile(targetTileId);
    return true;
  }

  return false;
}

function parseDropTargetNumber(element: Element, attribute: string): number | null {
  const value = element.getAttribute(attribute);
  return value === null ? null : parseInt(value, 10);
}

function allowPoolDragOverflow() {
  const poolElement = document.querySelector(POOL_SELECTOR) as HTMLElement | null;
  if (poolElement !== null) poolElement.style.overflow = "visible";
}

function restorePoolDragOverflow() {
  const poolElement = document.querySelector(POOL_SELECTOR) as HTMLElement | null;
  if (poolElement !== null) poolElement.style.overflow = "";
}
