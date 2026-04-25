/**
 * @file SubmissionSlot.tsx
 *
 * A single slot in the submission row. Empty slots are drop targets.
 * Filled slots display the resolved character, return the tile to the
 * pool on tap, and can be dragged to another slot to swap positions.
 */

import { useRef, useLayoutEffect } from "react";
import { resolveCharacter } from "../../lib/character";
import { Draggable, useGSAP, gsap } from "../../lib/animation/register";
import { animatePickUp, animateReposition } from "../../lib/animation/drag-animations";
import type { SubmissionSlot as SubmissionSlotType } from "../../context/game";
import styles from "./SubmissionSlot.module.css";

/**
 * @property slot - The slot state (empty or filled with a tile).
 * @property slotIndex - Index of this slot in the submission array.
 * @property isSubmitting - SubmissionArea sets this while evaluating a guess; slot plays a pulse.
 * @property isReady - SubmissionArea sets this when the full submission is valid; adds a glow.
 * @property onTap - Called when a filled slot is tapped; parent removes the tile.
 * @property onDropOnSlot - Called when a drag ends on another slot, with that slot's index.
 * @property onDropOnPool - Called when a drag ends over the pool; parent returns the tile.
 */
export type SubmissionSlotProps = {
  slot: SubmissionSlotType;
  slotIndex: number;
  isSubmitting?: boolean;
  isReady?: boolean;
  onTap: () => void;
  onDropOnSlot: (toSlotIndex: number) => void;
  onDropOnPool?: () => void;
};

/**
 * Renders a single submission slot. Empty slots are drop targets; filled slots
 * show the resolved character and return the tile to the pool on tap.
 *
 * @param props - {@link SubmissionSlotProps}
 */
export function SubmissionSlot({
  slot,
  slotIndex,
  isSubmitting = false,
  isReady = false,
  onTap,
  onDropOnSlot,
  onDropOnPool = () => {},
}: SubmissionSlotProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastOverRef = useRef<Element | null>(null);

  const isFilled = slot.state === "FILLED";
  const display = isFilled ? resolveCharacter(slot.character) : null;
  // Stable key for detecting swaps: which tile ID occupies this slot.
  const filledTileId = slot.state === "FILLED" ? slot.tileId : null;

  // Refs hold latest prop values so Draggable callbacks never go stale.
  const callbacksRef = useRef({ onTap, onDropOnSlot, onDropOnPool });
  callbacksRef.current = { onTap, onDropOnSlot, onDropOnPool };
  const slotIndexRef = useRef(slotIndex);
  slotIndexRef.current = slotIndex;

  // Clear any stale GSAP transforms before the entrance animation captures the element's
  // natural state as its "to" value. revertOnUpdate can record scale:0.6 (the "from"
  // value set synchronously by gsap.from) as the pre-animation snapshot and restore it
  // on a swap (filledTileId changes while isFilled stays true). If the snapshot is 0.6,
  // the new gsap.from captures 0.6 as its target → animates 0.6→0.6, stuck tiny.
  // React runs ALL cleanups before ALL setups (declaration order), so this setup fires
  // before useGSAP's setup, giving gsap.from a clean element to read.
  useLayoutEffect(() => {
    if (!isFilled || !buttonRef.current) return;
    gsap.set(buttonRef.current, { clearProps: "all" });
  }, [isFilled, filledTileId]);

  useGSAP(
    () => {
      if (!buttonRef.current || !isFilled) return;

      // VIS-22/23: entrance animation on fill or swap (filledTileId changed).
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
          animatePickUp(this.target as HTMLElement);
        },
        onDrag: function onDrag(this: Draggable) {
          const elements = document.elementsFromPoint?.(this.pointerX, this.pointerY) ?? [];
          const dropTarget = findSlotDropTarget(elements, slotIndexRef.current);

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
          const slotTarget = findSlotDropTarget(elements, slotIndexRef.current);
          if (slotTarget !== null) {
            callbacksRef.current.onDropOnSlot(
              parseInt(slotTarget.getAttribute("data-slot-index")!, 10),
            );
            // Swap dispatched — React re-renders with swapped content
            gsap.set(element, { clearProps: "all" });
            return;
          }

          if (isOverPool(elements)) {
            callbacksRef.current.onDropOnPool();
            gsap.set(element, { clearProps: "all" });
            return;
          }

          // No valid target — snap back to origin.
          animateReposition(element);
        },
        onClick: function onClick() {
          callbacksRef.current.onTap();
        },
      });
    },
    // Recreate Draggable (and replay entrance animation) when fill state or occupying tile changes.
    { scope: buttonRef, dependencies: [isFilled, filledTileId], revertOnUpdate: true },
  );

  // Clear any stale GSAP transforms when the slot becomes empty.
  // gsap.from() inside useGSAP sets scale: 0.6 synchronously as its "from" value.
  // revertOnUpdate can record that 0.6 as the pre-animation state and restore it,
  // leaving the empty slot visually shrunk. Running clearProps here (after useGSAP's
  // revert) ensures the element is clean before the next fill.
  useLayoutEffect(() => {
    if (isFilled || !buttonRef.current) return;
    gsap.set(buttonRef.current, { clearProps: "all" });
  }, [isFilled]);

  // VIS-24: brief scale pulse on all filled slots when a guess is being submitted.
  useLayoutEffect(() => {
    if (!isSubmitting || !isFilled || !buttonRef.current) return;
    const tween = gsap.to(buttonRef.current, {
      scale: 1.09,
      duration: 0.1,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
    });
    return () => {
      tween.kill();
    };
  }, [isSubmitting, isFilled]);

  const className = [
    styles.slot,
    isFilled ? styles.filled : styles.empty,
    isFilled && isReady ? styles.ready : null,
  ]
    .filter(Boolean)
    .join(" ");

  const button = (
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

  // When filled, wrap in a ghost div that stays at the original slot position
  // while the button is dragged away. The ghost shows the empty-slot appearance
  // so there is always a visible indicator of where the slot is.
  if (isFilled) {
    return (
      <div className={styles.slotGhost} data-slot-index={slotIndex}>
        {button}
      </div>
    );
  }

  return button;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Finds the first slot-eligible drop target from a hit list, skipping the
 * dragging slot itself.
 */
function findSlotDropTarget(elements: Element[], selfSlotIndex: number): Element | null {
  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue;
    if (element.getAttribute("data-slot-index") === String(selfSlotIndex)) continue;
    if (element.hasAttribute("data-slot-index")) return element;
  }
  return null;
}

/**
 * Returns true if any element in the hit list is the pool container.
 */
function isOverPool(elements: Element[]): boolean {
  return elements.some(
    (element) => element instanceof HTMLElement && element.hasAttribute("data-pool"),
  );
}
