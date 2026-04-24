/**
 * @file SubmissionSlot.tsx
 *
 * A single slot in the submission row. Empty slots are drop targets.
 * Filled slots display the resolved character, return the tile to the
 * pool on tap, and can be dragged to another slot to swap positions.
 */

import { useRef } from "react";
import { resolveCharacter } from "../../lib/character";
import { Draggable, useGSAP, gsap } from "../../lib/animation/register";
import { animatePickUp, animateReposition } from "../../lib/animation/drag-animations";
import type { SubmissionSlot as SubmissionSlotType } from "../../context/game";
import styles from "./SubmissionSlot.module.css";

/**
 * @property slot - The slot state (empty or filled with a tile).
 * @property slotIndex - Index of this slot in the submission array.
 * @property onTap - Called when a filled slot is tapped; parent removes the tile.
 * @property onDropOnSlot - Called when a drag ends on another slot, with that slot's index.
 */
export type SubmissionSlotProps = {
  slot: SubmissionSlotType;
  slotIndex: number;
  onTap: () => void;
  onDropOnSlot: (toSlotIndex: number) => void;
};

/**
 * Renders a single submission slot. Empty slots are drop targets; filled slots
 * show the resolved character and return the tile to the pool on tap.
 *
 * @param props - {@link SubmissionSlotProps}
 */
export function SubmissionSlot({ slot, slotIndex, onTap, onDropOnSlot }: SubmissionSlotProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastOverRef = useRef<Element | null>(null);

  const isFilled = slot.state === "FILLED";
  const display = isFilled ? resolveCharacter(slot.character) : null;

  // Refs hold latest prop values so Draggable callbacks never go stale.
  const callbacksRef = useRef({ onTap, onDropOnSlot });
  callbacksRef.current = { onTap, onDropOnSlot };
  const slotIndexRef = useRef(slotIndex);
  slotIndexRef.current = slotIndex;

  useGSAP(
    () => {
      if (!buttonRef.current || !isFilled) return;

      Draggable.create(buttonRef.current, {
        type: "x,y",
        zIndexBoost: true,
        dragClickables: true,
        onDragStart: function onDragStart(this: Draggable) {
          animatePickUp(this.target as HTMLElement);
        },
        onDrag: function onDrag(this: Draggable) {
          const elements = document.elementsFromPoint?.(this.pointerX, this.pointerY) ?? [];
          const dropTarget = findDropTarget(elements, slotIndexRef.current);

          if (lastOverRef.current !== null && lastOverRef.current !== dropTarget) {
            lastOverRef.current.removeAttribute("data-drag-over");
          }
          if (dropTarget !== null) {
            dropTarget.setAttribute("data-drag-over", "true");
          }
          lastOverRef.current = dropTarget;
        },
        onDragEnd: function onDragEnd(this: Draggable) {
          lastOverRef.current?.removeAttribute("data-drag-over");
          lastOverRef.current = null;

          const element = this.target as HTMLElement;
          const elements = document.elementsFromPoint?.(this.pointerX, this.pointerY) ?? [];
          const dropTarget = findDropTarget(elements, slotIndexRef.current);

          if (dropTarget !== null) {
            const toSlotIndexStr = dropTarget.getAttribute("data-slot-index");
            if (toSlotIndexStr !== null) {
              callbacksRef.current.onDropOnSlot(parseInt(toSlotIndexStr, 10));
              // Swap dispatched — React re-renders with swapped content
              gsap.set(element, { clearProps: "all" });
              return;
            }
          }

          // No valid target — reposition at current location
          animateReposition(element, this.x, this.y);
        },
        onClick: function onClick() {
          callbacksRef.current.onTap();
        },
      });
    },
    // Recreate Draggable when filled state changes
    { scope: buttonRef, dependencies: [isFilled], revertOnUpdate: true },
  );

  const className = [styles.slot, isFilled ? styles.filled : styles.empty]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      data-testid={`slot-${slotIndex}`}
      data-slot-index={slotIndex}
    >
      {display}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Finds the first slot-eligible drop target from a hit list, skipping the
 * dragging slot itself.
 */
function findDropTarget(elements: Element[], selfSlotIndex: number): Element | null {
  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue;
    if (element.getAttribute("data-slot-index") === String(selfSlotIndex)) continue;
    if (element.hasAttribute("data-slot-index")) return element;
  }
  return null;
}
