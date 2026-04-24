/**
 * @file Tile.tsx
 *
 * A single interactive tile in the jamo pool.
 * Owns GSAP Draggable mechanics — all game logic lives in Pool.
 *
 * Drag behavior (UI-04):
 * - Drag to SubmissionSlot → onDropOnSlot(slotIndex)
 * - Drag to another Tile → onDropOnTile(targetId)
 * GSAP Draggable handles click-vs-drag differentiation natively.
 */

import { useRef } from "react";
import { resolveCharacter } from "../../lib/character";
import { Draggable, useGSAP, gsap } from "../../lib/animation/register";
import { animatePickUp, animateReposition } from "../../lib/animation/drag-animations";
import type { Tile } from "../../context/game";
import styles from "./Tile.module.css";

/**
 * Props for the {@link Tile} component.
 *
 * @property tile - The tile data to render.
 * @property isTappable - Whether tapping this tile does anything; controls the inert CSS class.
 * @property isRejected - Pool sets this when a compose operation is rejected; Tile renders feedback.
 * @property onTap - Called on click when `isTappable` is true.
 * @property onDropOnTile - Called when a drag ends on another tile, with that tile's id.
 * @property onDropOnSlot - Called when a drag ends on a submission slot, with that slot's index.
 * @property onRejectedEnd - Called from onAnimationEnd; Pool uses this to clear the rejected state.
 */
export type TileProps = {
  tile: Tile;
  isTappable: boolean;
  isRejected: boolean;
  onTap: () => void;
  onDropOnTile: (targetId: number) => void;
  onDropOnSlot: (slotIndex: number) => void;
  onRejectedEnd: () => void;
};

/**
 * A single interactive tile in the jamo pool.
 * Owns GSAP Draggable mechanics — all game logic lives in {@link Pool}.
 *
 * @param props - See {@link TileProps}.
 */
export function Tile({
  tile,
  isTappable,
  isRejected,
  onTap,
  onDropOnTile,
  onDropOnSlot,
  onRejectedEnd,
}: TileProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastOverRef = useRef<Element | null>(null);

  // Refs hold latest prop values so Draggable callbacks never go stale.
  const callbacksRef = useRef({ isTappable, onTap, onDropOnTile, onDropOnSlot });
  callbacksRef.current = { isTappable, onTap, onDropOnTile, onDropOnSlot };
  const tileIdRef = useRef(tile.id);
  tileIdRef.current = tile.id;

  useGSAP(
    () => {
      if (!buttonRef.current) return;

      Draggable.create(buttonRef.current, {
        type: "x,y",
        zIndexBoost: true,
        dragClickables: true,
        onDragStart: function onDragStart(this: Draggable) {
          animatePickUp(this.target as HTMLElement);
        },
        onDrag: function onDrag(this: Draggable) {
          const elements = document.elementsFromPoint?.(this.pointerX, this.pointerY) ?? [];
          const dropTarget = findDropTarget(elements, tileIdRef.current);

          if (lastOverRef.current !== null && lastOverRef.current !== dropTarget) {
            lastOverRef.current.removeAttribute("data-drag-over");
          }
          if (dropTarget !== null) {
            dropTarget.setAttribute("data-drag-over", "true");
          }
          lastOverRef.current = dropTarget;
        },
        onDragEnd: function onDragEnd(this: Draggable) {
          // Clear any drop target highlighting
          lastOverRef.current?.removeAttribute("data-drag-over");
          lastOverRef.current = null;

          const element = this.target as HTMLElement;
          const elements = document.elementsFromPoint?.(this.pointerX, this.pointerY) ?? [];
          const dropTarget = findDropTarget(elements, tileIdRef.current);

          if (dropTarget !== null) {
            const slotIndexStr = dropTarget.getAttribute("data-slot-index");
            if (slotIndexStr !== null) {
              callbacksRef.current.onDropOnSlot(parseInt(slotIndexStr, 10));
              // Tile will unmount (removed from pool) — clear inline styles
              gsap.set(element, { clearProps: "all" });
              return;
            }

            const targetTileIdStr = dropTarget.getAttribute("data-tile-id");
            if (targetTileIdStr !== null) {
              callbacksRef.current.onDropOnTile(parseInt(targetTileIdStr, 10));
              // If compose succeeds, tile unmounts and animation is harmless.
              // If compose fails, tile stays at its dragged position — the
              // "reposition" behavior from the spec.
            }
          }

          // Reset scale/shadow; keep current position offset
          animateReposition(element, this.x, this.y);
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

  function handleAnimationEnd() {
    onRejectedEnd();
  }

  const display = resolveCharacter(tile.character);
  const className = [
    styles.tile,
    !isTappable ? styles.inert : null,
    isRejected ? styles.shaking : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      onAnimationEnd={handleAnimationEnd}
      data-testid={`tile-${tile.id}`}
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
 * dragging tile itself.
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
