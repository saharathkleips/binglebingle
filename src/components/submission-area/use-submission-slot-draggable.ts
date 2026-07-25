/**
 * @file use-submission-slot-draggable.ts
 *
 * GSAP Draggable wiring for filled submission slots.
 */

import { useRef } from "react";
import { Draggable, gsap, useGSAP } from "../../lib/animation/register";
import { animatePickUp, animateReposition } from "../../lib/animation/drag-animations";
import { MOTION_DURATION_SLOT_ENTRANCE } from "../../lib/animation/motion-tokens";
import {
  animateSnapBackFromRect,
  popPendingTileSnapBack,
  recordTileSnapBack,
} from "../../lib/animation/snap-back-animations";
import { animateEntranceScale } from "../../lib/animation/tile-animations";
import type { TileSnapBackSnapshot } from "../../lib/animation/snap-back-animations";
import {
  DATA_DROP_SLOT_TARGET_ACTIVE_ATTRIBUTE,
  DATA_POOL_ATTRIBUTE,
  DATA_SLOT_DRAGGING_ATTRIBUTE,
  DATA_SLOT_HITBOX_ATTRIBUTE,
  DATA_SLOT_INDEX_ATTRIBUTE,
  DATA_SLOT_PLACING_ATTRIBUTE,
  DATA_SUBMISSION_SLOTS_ATTRIBUTE,
} from "../../lib/dom-data-attributes";
import {
  findDropTarget as findDataAttributeDropTarget,
  findDropTargetTile,
  parseDropTargetNumber,
  removeDropTargetActiveAttributes,
  updateDropTargetHighlight,
} from "../tile/drop-target-helpers";
import { useLatestRef } from "../tile/use-latest-ref";

/** Options for wiring draggable behavior on a filled submission slot. */
export type UseSubmissionSlotDraggableOptions = {
  /** Ref to the filled slot button that GSAP Draggable should own. */
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  /** Whether this slot currently has a draggable tile. */
  isFilled: boolean;
  /** Tile identity lets cross-owner moves consume captured release rects by tile id. */
  filledTileId: number | null;
  /** Zero-based source slot index. */
  slotIndex: number;
  /** Called when Draggable resolves the pointer sequence as a tap. */
  onTap: () => void;
  /** Called when the drag is released on another submission slot. */
  onDropOnSlot: (toSlotIndex: number) => void;
  /** Called for tap-to-return and drags released outside the submission row. */
  onDropOnPool: () => void;
};

/**
 * Wires GSAP Draggable behavior for filled submission slots.
 *
 * @param options - Slot identity, element ref, and SubmissionArea-owned callbacks.
 */
export function useSubmissionSlotDraggable({
  buttonRef,
  isFilled,
  filledTileId,
  slotIndex,
  onTap,
  onDropOnSlot,
  onDropOnPool,
}: UseSubmissionSlotDraggableOptions) {
  const lastOverRef = useRef<Element | null>(null);
  const hasDraggedRef = useRef(false);
  const slotIndexRef = useLatestRef(slotIndex);
  const callbacksRef = useLatestRef({ onTap, onDropOnSlot, onDropOnPool });

  useGSAP(
    () => {
      if (!buttonRef.current || !isFilled) return;

      let deferredSnapBackFrame: number | null = null;
      let deferredSnapshot: TileSnapBackSnapshot | null = null;
      let activeSnapBackTween: gsap.core.Tween | null = null;

      if (filledTileId !== null) {
        const pendingSnapshot = popPendingTileSnapBack(filledTileId);
        if (pendingSnapshot !== null) {
          deferredSnapshot = pendingSnapshot;
          deferredSnapBackFrame = requestAnimationFrame(() => {
            deferredSnapBackFrame = null;
            if (!buttonRef.current) {
              pendingSnapshot.clone.remove();
              deferredSnapshot = null;
              return;
            }

            deferredSnapshot = null;
            setSlotPlacingAttribute(buttonRef.current);
            activeSnapBackTween = animateSnapBackFromRect(
              buttonRef.current,
              pendingSnapshot,
              () => {
                activeSnapBackTween = null;
                if (buttonRef.current) removeSlotPlacingAttribute(buttonRef.current);
              },
            );
          });
        } else {
          animateEntranceScale(buttonRef.current, undefined, {
            fromScale: 0.6,
            duration: MOTION_DURATION_SLOT_ENTRANCE,
          });
        }
      }

      const draggableInstances = Draggable.create(buttonRef.current, {
        type: "x,y",
        zIndexBoost: true,
        dragClickables: true,
        onDragStart: function onDragStart(this: Draggable) {
          hasDraggedRef.current = true;
          const element = this.target as HTMLElement;
          setSlotDraggingAttribute(element);
          animatePickUp(element);
        },
        onDrag: function onDrag(this: Draggable) {
          const elements = document.elementsFromPoint?.(this.pointerX, this.pointerY) ?? [];
          const dropTarget = findSlotDropTarget(
            elements,
            slotIndexRef.current,
            this.pointerX,
            this.pointerY,
          );

          updateDropTargetHighlight({
            previousTarget: lastOverRef.current,
            nextTarget: dropTarget,
            setActiveAttribute: setSlotDropTargetActiveAttribute,
          });
          lastOverRef.current = dropTarget;
        },
        onDragEnd: function onDragEnd(this: Draggable) {
          clearSlotDropTargetHighlight(lastOverRef);

          const element = this.target as HTMLElement;
          removeSlotDraggingAttribute(element);
          const elements = document.elementsFromPoint?.(this.pointerX, this.pointerY) ?? [];
          const slotTarget = findSlotDropTarget(
            elements,
            slotIndexRef.current,
            this.pointerX,
            this.pointerY,
          );
          if (slotTarget !== null) {
            if (filledTileId !== null) {
              recordTileSnapBack(filledTileId, element, { shouldLiftOnArrival: true });
            }
            recordDisplacedTileSnapBack(slotTarget);
            callbacksRef.current.onDropOnSlot(parseSlotIndex(slotTarget));
            finishCompletedDrop(element);
            return;
          }

          if (
            isOutsideSubmissionSlots(this.pointerX, this.pointerY, element) ||
            isOverPool(elements)
          ) {
            if (filledTileId !== null) recordTileSnapBack(filledTileId, element);
            callbacksRef.current.onDropOnPool();
            finishCompletedDrop(element);
            return;
          }

          animateReposition(element, resetDragClickGuardAfterClick);
        },
        onClick: function onClick(this: Draggable) {
          if (hasDraggedRef.current) {
            hasDraggedRef.current = false;
            return;
          }

          if (filledTileId !== null) recordTileSnapBack(filledTileId, this.target as HTMLElement);
          callbacksRef.current.onTap();
        },
      });

      return () => {
        if (deferredSnapBackFrame !== null) cancelAnimationFrame(deferredSnapBackFrame);
        if (deferredSnapshot !== null) deferredSnapshot.clone.remove();
        activeSnapBackTween?.kill();
        clearSlotDropTargetHighlight(lastOverRef);
        if (buttonRef.current) {
          removeSlotDraggingAttribute(buttonRef.current);
          removeSlotPlacingAttribute(buttonRef.current);
        }
        draggableInstances.forEach((draggableInstance) => draggableInstance.kill());
      };
    },
    { scope: buttonRef, dependencies: [isFilled, filledTileId], revertOnUpdate: true },
  );

  function finishCompletedDrop(element: HTMLElement) {
    gsap.set(element, { clearProps: "all" });
    resetDragClickGuardAfterClick();
  }

  function resetDragClickGuardAfterClick() {
    window.setTimeout(() => {
      hasDraggedRef.current = false;
    }, 0);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setSlotDropTargetActiveAttribute(element: Element) {
  element.setAttribute(DATA_DROP_SLOT_TARGET_ACTIVE_ATTRIBUTE, "true");
}

function findSlotDropTarget(
  elements: Element[],
  selfSlotIndex: number,
  pointerX: number,
  pointerY: number,
): Element | null {
  return (
    findDataAttributeDropTarget(elements, {
      acceptedAttributes: [DATA_SLOT_INDEX_ATTRIBUTE],
      excludedAttribute: DATA_SLOT_INDEX_ATTRIBUTE,
      excludedValue: String(selfSlotIndex),
    }) ?? findSlotDropTargetByPoint(selfSlotIndex, pointerX, pointerY)
  );
}

function findSlotDropTargetByPoint(
  selfSlotIndex: number,
  pointerX: number,
  pointerY: number,
): Element | null {
  return (
    Array.from(document.querySelectorAll(`[${DATA_SLOT_HITBOX_ATTRIBUTE}]`)).find((element) => {
      if (!(element instanceof HTMLElement)) return false;
      if (element.getAttribute(DATA_SLOT_INDEX_ATTRIBUTE) === String(selfSlotIndex)) return false;

      const rect = element.getBoundingClientRect();
      return (
        pointerX >= rect.left &&
        pointerX <= rect.right &&
        pointerY >= rect.top &&
        pointerY <= rect.bottom
      );
    }) ?? null
  );
}

function clearSlotDropTargetHighlight(lastOverRef: React.MutableRefObject<Element | null>) {
  if (lastOverRef.current !== null) removeDropTargetActiveAttributes(lastOverRef.current);
  lastOverRef.current = null;
}

function parseSlotIndex(slotTarget: Element): number {
  return (
    parseDropTargetNumber(slotTarget, DATA_SLOT_INDEX_ATTRIBUTE) ?? slotIndexParseError(slotTarget)
  );
}

function slotIndexParseError(slotTarget: Element): never {
  throw new Error(`Expected slot drop target to have ${DATA_SLOT_INDEX_ATTRIBUTE}: ${slotTarget}`);
}

function recordDisplacedTileSnapBack(dropTarget: Element): void {
  const displacedTile = findDropTargetTile(dropTarget);
  if (displacedTile === null) return;

  recordTileSnapBack(displacedTile.tileId, displacedTile.element);
}

/**
 * Returns true when the pointer has left every slot hitbox. A filled slot's tile remains
 * a child of the slots row while transformed, so only the fixed hitbox elements count.
 */
function isOutsideSubmissionSlots(
  pointerX: number,
  pointerY: number,
  element: HTMLElement,
): boolean {
  const slotsContainer = element.closest(`[${DATA_SUBMISSION_SLOTS_ATTRIBUTE}]`);
  if (!(slotsContainer instanceof HTMLElement)) return false;

  const slotHitboxes = Array.from(
    slotsContainer.querySelectorAll(`[${DATA_SLOT_HITBOX_ATTRIBUTE}]`),
  );
  if (slotHitboxes.length === 0) return false;

  return slotHitboxes.every((slotHitbox) => {
    const rect = slotHitbox.getBoundingClientRect();
    return (
      pointerX < rect.left || pointerX > rect.right || pointerY < rect.top || pointerY > rect.bottom
    );
  });
}

function isOverPool(elements: Element[]): boolean {
  return elements.some(
    (element) => element instanceof HTMLElement && element.hasAttribute(DATA_POOL_ATTRIBUTE),
  );
}

function setSlotDraggingAttribute(element: HTMLElement) {
  element.parentElement?.setAttribute(DATA_SLOT_DRAGGING_ATTRIBUTE, "true");
}

function removeSlotDraggingAttribute(element: HTMLElement) {
  element.parentElement?.removeAttribute(DATA_SLOT_DRAGGING_ATTRIBUTE);
}

function setSlotPlacingAttribute(element: HTMLElement) {
  element.parentElement?.setAttribute(DATA_SLOT_PLACING_ATTRIBUTE, "true");
}

function removeSlotPlacingAttribute(element: HTMLElement) {
  element.parentElement?.removeAttribute(DATA_SLOT_PLACING_ATTRIBUTE);
}
