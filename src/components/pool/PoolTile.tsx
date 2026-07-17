/**
 * @file PoolTile.tsx
 *
 * A single interactive pool tile in the jamo pool.
 * Uses pool-specific GSAP Draggable mechanics — all game logic lives in Pool.
 *
 * Drag behavior (UI-04):
 * - Drag to SubmissionSlot → onDropOnSlot(slotIndex)
 * - Drag to another pool tile → onDropOnTile(targetId)
 * GSAP Draggable handles click-vs-drag differentiation natively.
 *
 * Animation props (1.4.5):
 * - isRotating: plays a brief GSAP squeeze when the jamo cycles
 * - isJustComposed: plays a scale heartbeat + particle burst on the target tile
 * - isNewlyAdded: plays an entrance scale animation for newly-appeared tiles
 */

import { useLayoutEffect, useRef } from "react";
import {
  animateSnapBackFromRect,
  popPendingTileSnapBack,
} from "../../lib/animation/snap-back-animations";
import { CharacterTile } from "../tile/CharacterTile";
import { DATA_TILE_ID_ATTRIBUTE } from "../tile/drop-target-helpers";
import { useTileFeedback } from "../tile/use-tile-feedback";
import type { Tile } from "../../context/game";
import { usePoolTileDraggable } from "./use-pool-tile-draggable";
import styles from "./PoolTile.module.css";

/**
 * Props for the {@link PoolTile} component.
 *
 * @property tile - The tile data to render.
 * @property isTappable - Whether tapping this tile does anything; drag remains available either way.
 * @property isRotating - Pool sets this when the tile's jamo was just rotated; PoolTile plays a brief GSAP squeeze.
 * @property isJustComposed - Pool sets this on the target tile after a successful compose; PoolTile plays heartbeat + particles.
 * @property isNewlyAdded - Pool sets this when this tile ID first appears in the pool; PoolTile plays entrance animation.
 * @property onTap - Called on click when `isTappable` is true.
 * @property onDropOnTile - Called when a drag ends on another tile, with that tile's id. Returns whether the drop was accepted.
 * @property onDropOnSlot - Called when a drag ends on a submission slot, with that slot's index. Returns whether the drop was accepted.
 * @property getDropTargetFeedback - Returns whether the current target accepts the drop and any preview text to show.
 * @property onRotatingEnd - Called after the rotate squeeze completes; Pool clears rotatingTileId.
 * @property onComposedEnd - Called after the compose heartbeat completes; Pool clears composedTileId.
 * @property onNewlyAddedEnd - Called after the entrance animation completes; Pool clears the id.
 */
export type PoolTileProps = {
  tile: Tile;
  isTappable: boolean;
  isRotating?: boolean;
  isJustComposed?: boolean;
  isNewlyAdded?: boolean;
  onTap: () => void;
  onDropOnTile: (targetId: number) => boolean;
  onDropOnSlot: (slotIndex: number) => boolean;
  getDropTargetFeedback: (target: Element) => { canDrop: boolean; preview: string | null };
  onRotatingEnd?: () => void;
  onComposedEnd?: () => void;
  onNewlyAddedEnd?: () => void;
};

/**
 * A single interactive pool tile in the jamo pool.
 * Uses pool-specific GSAP Draggable mechanics — all game logic lives in {@link Pool}.
 *
 * @param props - See {@link PoolTileProps}.
 */
export function PoolTile({
  tile,
  isTappable,
  isRotating = false,
  isJustComposed = false,
  isNewlyAdded = false,
  onTap,
  onDropOnTile,
  onDropOnSlot,
  getDropTargetFeedback,
  onRotatingEnd,
  onComposedEnd,
  onNewlyAddedEnd,
}: PoolTileProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const pendingSnapshot = popPendingTileSnapBack(tile.id);
    if (pendingSnapshot === null || !buttonRef.current) return;

    animateSnapBackFromRect(buttonRef.current, pendingSnapshot);
  }, [tile.id]);

  useTileFeedback({
    elementRef: buttonRef,
    isRotating,
    isJustComposed,
    isNewlyAdded,
    onRotatingEnd,
    onComposedEnd,
    onNewlyAddedEnd,
  });

  usePoolTileDraggable({
    buttonRef,
    tileId: tile.id,
    isTappable,
    onTap,
    onDropOnTile,
    onDropOnSlot,
    getDropTargetFeedback,
  });

  return (
    <div className={styles.cell}>
      <CharacterTile
        character={tile.character}
        dataAttributes={{ [DATA_TILE_ID_ATTRIBUTE]: tile.id }}
        element="button"
        isInteractive
        ref={buttonRef}
      />
    </div>
  );
}
