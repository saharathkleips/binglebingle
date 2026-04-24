/**
 * @file Pool.tsx
 *
 * Displays the player's jamo pool as a row of interactive Tile tiles.
 * Owns all interaction logic: tap dispatch, compose validation, slot insertion.
 * Tracks animation state (rotating, composed, newly-added) and forwards it to Tile.
 */

import { useState, useLayoutEffect, useRef } from "react";
import { useGame } from "../../context/game/GameContext";
import { getNextRotation } from "../../lib/character/rotation";
import { decompose, compose } from "../../lib/character/composition";
import { Tile } from "./Tile";
import type { Tile as TileType } from "../../context/game";
import styles from "./Pool.module.css";

/**
 * Renders the player's jamo pool. Reads pool state from `useGame()` and owns
 * all interaction logic: tap dispatch, compose validation, slot insertion.
 */
export function Pool() {
  const { state, dispatch } = useGame();
  const [rejectedTileIds, setRejectedTileIds] = useState<Set<number>>(new Set());
  const [rotatingTileId, setRotatingTileId] = useState<number | null>(null);
  const [composedTileId, setComposedTileId] = useState<number | null>(null);
  const [newlyAddedTileIds, setNewlyAddedTileIds] = useState<Set<number>>(new Set());

  // Detect newly-added tiles by comparing pool IDs between renders.
  const prevPoolIdsRef = useRef<Set<number>>(new Set(state.pool.map((tile) => tile.id)));
  useLayoutEffect(() => {
    const currentIds = new Set(state.pool.map((tile) => tile.id));
    const addedIds = [...currentIds].filter((id) => !prevPoolIdsRef.current.has(id));
    if (addedIds.length > 0) {
      setNewlyAddedTileIds((prev) => {
        const next = new Set(prev);
        addedIds.forEach((id) => next.add(id));
        return next;
      });
    }
    prevPoolIdsRef.current = currentIds;
  }, [state.pool]);

  function handleTap(tile: TileType) {
    if (getNextRotation(tile.character) !== null) {
      setRotatingTileId(tile.id);
      dispatch({ type: "CHARACTER_ROTATE_NEXT", payload: { tileId: tile.id } });
    } else if (decompose(tile.character) !== null) {
      dispatch({ type: "CHARACTER_DECOMPOSE", payload: { tileId: tile.id } });
    }
  }

  function handleDropOnTile(sourceTile: TileType, targetId: number) {
    const targetTile = state.pool.find((tile) => tile.id === targetId);
    if (targetTile === undefined) return;
    const combined = compose(targetTile.character, sourceTile.character);
    if (combined === null) {
      setRejectedTileIds((prev) => new Set(prev).add(sourceTile.id));
    } else {
      setComposedTileId(targetId);
      dispatch({ type: "CHARACTER_COMPOSE", payload: { targetId, incomingId: sourceTile.id } });
    }
  }

  function handleDropOnSlot(sourceTile: TileType, slotIndex: number) {
    dispatch({ type: "SUBMISSION_SLOT_INSERT", payload: { tileId: sourceTile.id, slotIndex } });
  }

  return (
    <div className={styles.pool} data-testid="pool">
      {state.pool.map((tile) => {
        const isTappable =
          getNextRotation(tile.character) !== null || decompose(tile.character) !== null;
        return (
          <Tile
            key={tile.id}
            tile={tile}
            isTappable={isTappable}
            isRejected={rejectedTileIds.has(tile.id)}
            isRotating={rotatingTileId === tile.id}
            isJustComposed={composedTileId === tile.id}
            isNewlyAdded={newlyAddedTileIds.has(tile.id)}
            onTap={() => handleTap(tile)}
            onDropOnTile={(targetId) => handleDropOnTile(tile, targetId)}
            onDropOnSlot={(slotIndex) => handleDropOnSlot(tile, slotIndex)}
            onRejectedEnd={() =>
              setRejectedTileIds((prev) => {
                const next = new Set(prev);
                next.delete(tile.id);
                return next;
              })
            }
            onRotatingEnd={() => setRotatingTileId(null)}
            onComposedEnd={() => setComposedTileId(null)}
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
