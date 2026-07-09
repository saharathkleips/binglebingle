/**
 * @file use-submission-slot-draggable.ts
 *
 * GSAP Draggable wiring for filled submission slots.
 */

import { useRef } from "react";
import { Draggable, gsap, useGSAP } from "../../lib/animation/register";
import { animatePickUp, animateReposition } from "../../lib/animation/drag-animations";
import {
  DATA_SLOT_INDEX_ATTRIBUTE,
  findDropTarget as findDataAttributeDropTarget,
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
  const slotIndexRef = useLatestRef(slotIndex);
  const callbacksRef = useLatestRef({ onTap, onDropOnSlot, onDropOnPool });

  useGSAP(
    () => {
      if (!buttonRef.current || !isFilled) return;

      gsap.from(buttonRef.current, {
        scale: 0.6,
        duration: 0.2,
        ease: "back.out(1.7)",
      });

      Draggable.create(buttonRef.current, {
        type: "x,y",
        zIndexBoost: true,
        dragClickables: true,
        onDragStart: function onDragStart(this: Draggable) {
          const element = this.target as HTMLElement;
          setSlotDraggingAttribute(element);
          animatePickUp(element);
        },
        onDrag: function onDrag(this: Draggable) {
          const elements = document.elementsFromPoint?.(this.pointerX, this.pointerY) ?? [];
          const dropTarget = findSlotDropTarget(elements, slotIndexRef.current);

          updateDropTargetHighlight({
            previousTarget: lastOverRef.current,
            nextTarget: dropTarget,
          });
          lastOverRef.current = dropTarget;
        },
        onDragEnd: function onDragEnd(this: Draggable) {
          clearSlotDropTargetHighlight(lastOverRef);

          const element = this.target as HTMLElement;
          removeSlotDraggingAttribute(element);
          const elements = document.elementsFromPoint?.(this.pointerX, this.pointerY) ?? [];
          const slotTarget = findSlotDropTarget(elements, slotIndexRef.current);
          if (slotTarget !== null) {
            callbacksRef.current.onDropOnSlot(parseSlotIndex(slotTarget));
            gsap.set(element, { clearProps: "all" });
            return;
          }

          if (
            isOutsideSubmissionSlots(this.pointerX, this.pointerY, element) ||
            isOverPool(elements)
          ) {
            callbacksRef.current.onDropOnPool();
            gsap.set(element, { clearProps: "all" });
            return;
          }

          animateReposition(element);
        },
        onClick: function onClick() {
          callbacksRef.current.onTap();
        },
      });
    },
    { scope: buttonRef, dependencies: [isFilled, filledTileId], revertOnUpdate: true },
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findSlotDropTarget(elements: Element[], selfSlotIndex: number): Element | null {
  return findDataAttributeDropTarget(elements, {
    acceptedAttributes: [DATA_SLOT_INDEX_ATTRIBUTE],
    excludedAttribute: DATA_SLOT_INDEX_ATTRIBUTE,
    excludedValue: String(selfSlotIndex),
  });
}

function clearSlotDropTargetHighlight(lastOverRef: React.MutableRefObject<Element | null>) {
  if (lastOverRef.current !== null) removeDropTargetActiveAttributes(lastOverRef.current);
  lastOverRef.current = null;
}

function parseSlotIndex(slotTarget: Element): number {
  return parseInt(slotTarget.getAttribute(DATA_SLOT_INDEX_ATTRIBUTE)!, 10);
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
