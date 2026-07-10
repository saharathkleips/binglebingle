/**
 * @file use-submission-slot-draggable.ts
 *
 * GSAP Draggable wiring for filled submission slots.
 */

import { useRef } from "react";
import { Draggable, gsap, useGSAP } from "../../lib/animation/register";
import {
  animatePickUp,
  animateReposition,
  animateSnapBackFromRect,
  popPendingTileSnapBack,
  recordTileSnapBack,
} from "../../lib/animation/drag-animations";
import type { TileSnapBackSnapshot } from "../../lib/animation/drag-animations";
import {
  DATA_DROP_SLOT_TARGET_ACTIVE_ATTRIBUTE,
  DATA_SLOT_INDEX_ATTRIBUTE,
  findDropTarget as findDataAttributeDropTarget,
  findDropTargetTile,
  parseDropTargetNumber,
  removeDropTargetActiveAttributes,
  updateDropTargetHighlight,
} from "../tile/drop-target-helpers";
import { useLatestRef } from "../tile/use-latest-ref";

export type UseSubmissionSlotDraggableOptions = {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  isFilled: boolean;
  filledTileId: number | null;
  slotIndex: number;
  onTap: () => void;
  onDropOnSlot: (toSlotIndex: number) => void;
  onDropOnPool: () => void;
};

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
            animateSnapBackFromRect(buttonRef.current, pendingSnapshot, () => {
              if (buttonRef.current) removeSlotPlacingAttribute(buttonRef.current);
            });
          });
        } else {
          gsap.from(buttonRef.current, {
            scale: 0.6,
            duration: 0.2,
            ease: "back.out(1.7)",
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
            gsap.set(element, { clearProps: "all" });
            resetDragClickGuardAfterClick();
            return;
          }

          if (
            isOutsideSubmissionSlots(this.pointerX, this.pointerY, element) ||
            isOverPool(elements)
          ) {
            if (filledTileId !== null) recordTileSnapBack(filledTileId, element);
            callbacksRef.current.onDropOnPool();
            gsap.set(element, { clearProps: "all" });
            resetDragClickGuardAfterClick();
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
    Array.from(document.querySelectorAll("[data-slot-hitbox]")).find((element) => {
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
  const slotsContainer = element.closest("[data-submission-slots]");
  if (!(slotsContainer instanceof HTMLElement)) return false;

  const slotHitboxes = Array.from(slotsContainer.querySelectorAll("[data-slot-hitbox]"));
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
    (element) => element instanceof HTMLElement && element.hasAttribute("data-pool"),
  );
}

function setSlotDraggingAttribute(element: HTMLElement) {
  element.parentElement?.setAttribute("data-slot-dragging", "true");
}

function removeSlotDraggingAttribute(element: HTMLElement) {
  element.parentElement?.removeAttribute("data-slot-dragging");
}

function setSlotPlacingAttribute(element: HTMLElement) {
  element.parentElement?.setAttribute("data-slot-placing", "true");
}

function removeSlotPlacingAttribute(element: HTMLElement) {
  element.parentElement?.removeAttribute("data-slot-placing");
}
