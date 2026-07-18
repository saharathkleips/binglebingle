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

/** Props for the {@link PoolTile} component. */
export type PoolTileProps = {
  /** Tile data to render and use for drag identity. */
  tile: Tile;
  /** Whether tapping this tile does anything; drag remains available either way. */
  isTappable: boolean;
  /** Pool sets this when the tile's jamo was just rotated; PoolTile plays a brief GSAP squeeze. */
  isRotating?: boolean;
  /** Pool sets this on the target tile after a successful compose; PoolTile plays heartbeat + particles. */
  isJustComposed?: boolean;
  /** Pool sets this when this tile ID first appears in the pool; PoolTile plays entrance animation. */
  isNewlyAdded?: boolean;
  /** Called on click when `isTappable` is true. */
  onTap: () => void;
  /** Called when a drag ends on another tile. Returns whether the drop was accepted. */
  onDropOnTile: (targetId: number) => boolean;
  /** Called when a drag ends on a submission slot. Returns whether the drop was accepted. */
  onDropOnSlot: (slotIndex: number) => boolean;
  /** Returns whether the current drag target accepts the drop and any preview text to show. */
  getDropTargetFeedback: (target: Element) => { canDrop: boolean; preview: string | null };
  /** Called after the rotate squeeze completes so Pool can clear `rotatingTileId`. */
  onRotatingEnd?: () => void;
  /** Called after the compose heartbeat completes so Pool can clear `composedTileId`. */
  onComposedEnd?: () => void;
  /** Called after the entrance animation completes so Pool can clear the newly-added id. */
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
