/**
 * @file SubmissionSlot.tsx
 *
 * A single slot in the submission row. Empty slots are drop targets.
 * Filled slots display the resolved character, return the tile to the
 * pool on tap, and can be dragged to another slot to swap positions.
 */

import { useState, useRef } from "react";
import { resolveCharacter } from "../../lib/character";
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

const DRAG_THRESHOLD_PX = 4;

/**
 * Renders a single submission slot. Empty slots are drop targets; filled slots
 * show the resolved character and return the tile to the pool on tap.
 *
 * @param props - {@link SubmissionSlotProps}
 */
export function SubmissionSlot({ slot, slotIndex, onTap, onDropOnSlot }: SubmissionSlotProps) {
  const [isDragging, setIsDragging] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const lastOverRef = useRef<Element | null>(null);
  // Set in pointerup after a drag so the synthetic click event can be suppressed.
  const wasDragRef = useRef(false);

  const isFilled = slot.state === "FILLED";
  const display = isFilled ? resolveCharacter(slot.character) : null;

  function handleClick() {
    if (wasDragRef.current) {
      wasDragRef.current = false;
      return;
    }
    if (isFilled) {
      onTap();
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (!isFilled) return;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const start = dragStartRef.current;
    if (start === null) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (!isDraggingRef.current) {
      if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD_PX) return;

      isDraggingRef.current = true;
      setIsDragging(true);
      buttonRef.current?.setPointerCapture?.(event.pointerId);

      const ghost = document.createElement("div");
      ghost.textContent = display;
      Object.assign(ghost.style, GHOST_STYLES);
      document.body.appendChild(ghost);
      ghostRef.current = ghost;
    }

    const ghost = ghostRef.current;
    if (ghost !== null) {
      ghost.style.left = `${event.clientX - 24}px`;
      ghost.style.top = `${event.clientY - 24}px`;
    }

    const elements = document.elementsFromPoint?.(event.clientX, event.clientY) ?? [];
    const dropTarget = findDropTarget(elements, slotIndex);

    if (lastOverRef.current !== null && lastOverRef.current !== dropTarget) {
      lastOverRef.current.removeAttribute("data-drag-over");
    }
    if (dropTarget !== null) {
      dropTarget.setAttribute("data-drag-over", "true");
    }
    lastOverRef.current = dropTarget;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    dragStartRef.current = null;
    if (!isDraggingRef.current) return;

    cleanupDrag();
    wasDragRef.current = true;

    const elements = document.elementsFromPoint?.(event.clientX, event.clientY) ?? [];
    const dropTarget = findDropTarget(elements, slotIndex);
    if (dropTarget === null) return;

    const toSlotIndexStr = dropTarget.getAttribute("data-slot-index");
    if (toSlotIndexStr !== null) {
      onDropOnSlot(parseInt(toSlotIndexStr, 10));
    }
  }

  function handlePointerCancel() {
    dragStartRef.current = null;
    if (!isDraggingRef.current) return;
    cleanupDrag();
  }

  function cleanupDrag() {
    ghostRef.current?.remove();
    ghostRef.current = null;
    lastOverRef.current?.removeAttribute("data-drag-over");
    lastOverRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
  }

  const className = [
    styles.slot,
    isFilled ? styles.filled : styles.empty,
    isDragging ? styles.dragging : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      onClick={isFilled ? handleClick : undefined}
      onPointerDown={isFilled ? handlePointerDown : undefined}
      onPointerMove={isFilled ? handlePointerMove : undefined}
      onPointerUp={isFilled ? handlePointerUp : undefined}
      onPointerCancel={isFilled ? handlePointerCancel : undefined}
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

const GHOST_STYLES: Partial<CSSStyleDeclaration> = {
  position: "fixed",
  width: "3rem",
  height: "3rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.5rem",
  border: "2px solid #ccc",
  borderRadius: "0.5rem",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  pointerEvents: "none",
  zIndex: "9999",
  userSelect: "none",
  opacity: "0.9",
};
