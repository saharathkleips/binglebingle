/**
 * @file Token.tsx
 *
 * A single interactive tile in the jamo pool.
 * Tap behavior depends on the tile's character:
 * - Rotatable single-jamo → CHARACTER_ROTATE_NEXT
 * - Decomposable multi-jamo → CHARACTER_DECOMPOSE
 * - Otherwise → inert (drag only)
 *
 * Drag behavior (UI-04):
 * - Drag to SubmissionSlot → SUBMISSION_SLOT_INSERT
 * - Drag to another Token → CHARACTER_COMPOSE (shake on invalid)
 * A 4px movement threshold distinguishes tap from drag.
 */

import { useState, useRef, type Dispatch } from "react";
import { resolveCharacter } from "../../lib/character";
import { getNextRotation } from "../../lib/character/rotation";
import { decompose, compose } from "../../lib/character/composition";
import type { Tile, GameAction } from "../../context/game";
import styles from "./Token.module.css";

export type TokenProps = {
  tile: Tile;
  /** Pool tiles needed to look up the target character during Token→Token drag. */
  pool?: readonly Tile[];
  dispatch: Dispatch<GameAction>;
};

const DRAG_THRESHOLD_PX = 4;

export function Token({ tile, pool = [], dispatch }: TokenProps) {
  const [isShaking, setIsShaking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isRotatable = getNextRotation(tile.character) !== null;
  const isDecomposable = decompose(tile.character) !== null;
  const isTappable = isRotatable || isDecomposable;

  const buttonRef = useRef<HTMLButtonElement>(null);
  // Refs track mutable drag state without triggering re-renders on every move.
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const lastOverRef = useRef<Element | null>(null);
  // Set in pointerup after a drag so the synthetic click event can be suppressed.
  const wasDragRef = useRef(false);

  function handleClick() {
    if (wasDragRef.current) {
      wasDragRef.current = false;
      return;
    }
    if (isRotatable) {
      dispatch({ type: "CHARACTER_ROTATE_NEXT", payload: { tileId: tile.id } });
    } else if (isDecomposable) {
      dispatch({ type: "CHARACTER_DECOMPOSE", payload: { tileId: tile.id } });
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
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
      // Pointer capture routes all subsequent pointer events to this element.
      buttonRef.current?.setPointerCapture?.(event.pointerId);

      const display = resolveCharacter(tile.character);
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

    // ghost has pointer-events:none so elementsFromPoint skips it.
    // elementsFromPoint is not implemented in all environments (e.g. jsdom).
    const elements = document.elementsFromPoint?.(event.clientX, event.clientY) ?? [];
    const dropTarget = findDropTarget(elements, tile.id);

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
    const dropTarget = findDropTarget(elements, tile.id);
    if (dropTarget === null) return;

    const slotIndexStr = dropTarget.getAttribute("data-slot-index");
    if (slotIndexStr !== null) {
      dispatch({
        type: "SUBMISSION_SLOT_INSERT",
        payload: { tileId: tile.id, slotIndex: parseInt(slotIndexStr, 10) },
      });
      return;
    }

    const targetTileIdStr = dropTarget.getAttribute("data-tile-id");
    if (targetTileIdStr !== null) {
      const targetId = parseInt(targetTileIdStr, 10);
      const targetTile = pool.find((t) => t.id === targetId);
      if (targetTile === undefined) return;
      const combined = compose(targetTile.character, tile.character);
      if (combined === null) {
        setIsShaking(true);
      } else {
        dispatch({ type: "CHARACTER_COMPOSE", payload: { targetId, incomingId: tile.id } });
      }
    }
  }

  function handlePointerCancel() {
    dragStartRef.current = null;
    if (!isDraggingRef.current) return;
    cleanupDrag();
  }

  function handleAnimationEnd() {
    setIsShaking(false);
  }

  function cleanupDrag() {
    ghostRef.current?.remove();
    ghostRef.current = null;
    lastOverRef.current?.removeAttribute("data-drag-over");
    lastOverRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
  }

  const display = resolveCharacter(tile.character);
  const className = [
    styles.token,
    !isTappable ? styles.inert : null,
    isShaking ? styles.shaking : null,
    isDragging ? styles.dragging : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onAnimationEnd={handleAnimationEnd}
      data-testid={`token-${tile.id}`}
      data-tile-id={tile.id}
    >
      {display}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Finds the first drop-eligible element from a hit list, skipping the
 * dragging token itself.
 */
function findDropTarget(elements: Element[], selfTileId: number): Element | null {
  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue;
    if (element.getAttribute("data-tile-id") === String(selfTileId)) continue;
    if (element.hasAttribute("data-slot-index") || element.hasAttribute("data-tile-id")) {
      return element;
    }
  }
  return null;
}

// Inline styles for the drag ghost so it matches Token visually without
// requiring a global CSS class.
const GHOST_STYLES: Partial<CSSStyleDeclaration> = {
  position: "fixed",
  width: "3rem",
  height: "3rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.5rem",
  border: "1px solid #ccc",
  borderRadius: "0.5rem",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  pointerEvents: "none",
  zIndex: "9999",
  userSelect: "none",
  opacity: "0.9",
};
