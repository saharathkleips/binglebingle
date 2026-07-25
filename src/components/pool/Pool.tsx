/**
 * @file Pool.tsx
 *
 * Displays the player's jamo pool as a row of interactive pool tiles.
 * Owns all interaction logic: tap dispatch, compose validation, slot insertion.
 * Tracks animation state (rotating, composed, newly-added) and forwards it to PoolTile.
 */

import { useState, useLayoutEffect, useMemo, useRef } from "react";
import { useGame } from "../../context/game/GameContext";
import {
  clearTileEntranceSnapBackSuppressions,
  recordTileSnapBack,
  shouldSuppressTileEntranceForSnapBack,
} from "../../lib/animation/snap-back-animations";
import { resolveCharacter } from "../../lib/character";
import { getNextRotation } from "../../lib/character/rotation";
import { decompose, compose } from "../../lib/character/composition";
import {
  DATA_INPUT_LOCKED_ATTRIBUTE,
  DATA_POOL_ATTRIBUTE,
  DATA_SLOT_INDEX_ATTRIBUTE,
  DATA_TILE_ID_ATTRIBUTE,
} from "../../lib/dom-data-attributes";
import { PoolTile } from "./PoolTile";
import { parseDropTargetNumber } from "../tile/drop-target-helpers";
import type { SubmissionSlot, Tile as TileType } from "../../context/game";
import styles from "./Pool.module.css";

/**
 * Renders the player's jamo pool. Reads pool state from `useGame()` and owns
 * all interaction logic: tap dispatch, compose validation, slot insertion.
 */
export function Pool() {
  const { state, dispatch, isInputLocked } = useGame();
  const [rotatingTileId, setRotatingTileId] = useState<number | null>(null);
  const [composedTileId, setComposedTileId] = useState<number | null>(null);
  const [newlyAddedTileIds, setNewlyAddedTileIds] = useState<Set<number>>(new Set());
  const poolTilesById = useMemo(
    () => new Map(state.pool.map((tile) => [tile.id, tile])),
    [state.pool],
  );

  // Detect newly-added tiles by comparing pool IDs between renders.
  const prevPoolIdsRef = useRef<Set<number>>(new Set(state.pool.map((tile) => tile.id)));
  useLayoutEffect(() => {
    const currentIds = new Set(state.pool.map((tile) => tile.id));
    const addedIds = [...currentIds].filter(
      (id) => !prevPoolIdsRef.current.has(id) && !shouldSuppressTileEntranceForSnapBack(id),
    );
    clearTileEntranceSnapBackSuppressions(currentIds);
    setNewlyAddedTileIds((prev) => {
      const retainedIds = [...prev].filter((id) => currentIds.has(id));
      const hasPrunedIds = retainedIds.length !== prev.size;
      if (addedIds.length === 0 && !hasPrunedIds) return prev;

      const next = new Set(retainedIds);
      addedIds.forEach((id) => next.add(id));
      return next;
    });
    prevPoolIdsRef.current = currentIds;
  }, [state.pool]);

  function handleTap(tile: TileType, sourceElement?: HTMLElement) {
    if (isInputLocked) return;

    if (getNextRotation(tile.character) !== null) {
      setRotatingTileId(tile.id);
      dispatch({ type: "CHARACTER_ROTATE_NEXT", payload: { tileId: tile.id } });
      return;
    }

    const parts = decompose(tile.character);
    if (parts === null) return;

    if (sourceElement instanceof HTMLElement) {
      const newTileId = getNextMissingTileId(state.pool, state.submission);
      recordTileSnapBack(newTileId, sourceElement, {
        cloneText: resolveCharacter(parts[1]) ?? "",
      });
    }
    dispatch({ type: "CHARACTER_DECOMPOSE", payload: { tileId: tile.id } });
  }

  function handleDropOnTile(sourceTile: TileType, targetId: number): boolean {
    if (isInputLocked) return false;

    const composedCharacter = getComposedCharacter(sourceTile, targetId);
    if (composedCharacter === null) return false;

    setComposedTileId(targetId);
    dispatch({ type: "CHARACTER_COMPOSE", payload: { targetId, incomingId: sourceTile.id } });
    return true;
  }

  function handleDropOnSlot(sourceTile: TileType, slotIndex: number): boolean {
    if (isInputLocked) return false;

    dispatch({ type: "SUBMISSION_SLOT_INSERT", payload: { tileId: sourceTile.id, slotIndex } });
    return true;
  }

  function getDropTargetFeedback(sourceTile: TileType, target: Element) {
    if (isInputLocked) return { canDrop: false, preview: null };

    if (target.hasAttribute(DATA_SLOT_INDEX_ATTRIBUTE)) return { canDrop: true, preview: null };

    const targetId = parseTileId(target);
    if (targetId === null) return { canDrop: false, preview: null };

    const composedCharacter = getComposedCharacter(sourceTile, targetId);
    return composedCharacter === null
      ? { canDrop: false, preview: null }
      : { canDrop: true, preview: resolveCharacter(composedCharacter) };
  }

  function getComposedCharacter(sourceTile: TileType, targetId: number) {
    const targetTile = poolTilesById.get(targetId);
    return targetTile === undefined ? null : compose(targetTile.character, sourceTile.character);
  }

  return (
    <div
      className={styles.pool}
      role="group"
      aria-label="Jamo pool"
      aria-disabled={isInputLocked || undefined}
      {...{
        [DATA_INPUT_LOCKED_ATTRIBUTE]: isInputLocked || undefined,
        [DATA_POOL_ATTRIBUTE]: true,
      }}
    >
      {state.pool.map((tile) => {
        return (
          <PoolTile
            key={tile.id}
            tile={tile}
            isTappable={!isInputLocked && canTapTile(tile)}
            isRotating={rotatingTileId === tile.id}
            isJustComposed={composedTileId === tile.id}
            isNewlyAdded={newlyAddedTileIds.has(tile.id)}
            onTap={(sourceElement) => handleTap(tile, sourceElement)}
            onDropOnTile={(targetId) => handleDropOnTile(tile, targetId)}
            onDropOnSlot={(slotIndex) => handleDropOnSlot(tile, slotIndex)}
            getDropTargetFeedback={(target) => getDropTargetFeedback(tile, target)}
            onRotatingEnd={() =>
              setRotatingTileId((currentId) => (currentId === tile.id ? null : currentId))
            }
            onComposedEnd={() =>
              setComposedTileId((currentId) => (currentId === tile.id ? null : currentId))
            }
            onNewlyAddedEnd={() =>
              setNewlyAddedTileIds((prev) => {
                const next = new Set(prev);
                next.delete(tile.id);
                return next;
              })
            }
          />
        );
      })}
    </div>
  );
}

function canTapTile(tile: TileType): boolean {
  return getNextRotation(tile.character) !== null || decompose(tile.character) !== null;
}

function parseTileId(element: Element): number | null {
  return parseDropTargetNumber(element, DATA_TILE_ID_ATTRIBUTE);
}

function getNextMissingTileId(
  pool: readonly TileType[],
  submission: readonly SubmissionSlot[],
): number {
  const usedIds = new Set([
    ...pool.map((tile) => tile.id),
    ...submission.flatMap((slot) => (slot.state === "FILLED" ? [slot.tileId] : [])),
  ]);

  let nextId = 0;
  while (usedIds.has(nextId)) nextId += 1;
  return nextId;
}
