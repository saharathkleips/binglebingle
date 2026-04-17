/**
 * @file Token.tsx
 *
 * A single interactive tile in the jamo pool.
 * Tap behavior depends on the tile's character:
 * - Rotatable single-jamo → CHARACTER_ROTATE_NEXT
 * - Decomposable multi-jamo → CHARACTER_DECOMPOSE
 * - Otherwise → inert (drag only)
 */

import { useState, type Dispatch } from "react";
import { resolveCharacter } from "../../lib/character";
import { getNextRotation } from "../../lib/character/rotation";
import { decompose } from "../../lib/character/composition";
import type { Tile, GameAction } from "../../context/game";
import styles from "./Token.module.css";

export type TokenProps = {
  tile: Tile;
  dispatch: Dispatch<GameAction>;
};

export function Token({ tile, dispatch }: TokenProps) {
  const [isShaking, setIsShaking] = useState(false);

  const isRotatable = getNextRotation(tile.character) !== null;
  const isDecomposable = decompose(tile.character) !== null;
  const isTappable = isRotatable || isDecomposable;

  function handleClick() {
    if (isRotatable) {
      dispatch({ type: "CHARACTER_ROTATE_NEXT", payload: { tileId: tile.id } });
    } else if (isDecomposable) {
      dispatch({ type: "CHARACTER_DECOMPOSE", payload: { tileId: tile.id } });
    }
  }

  function handleAnimationEnd() {
    setIsShaking(false);
  }

  const display = resolveCharacter(tile.character);
  const className = `${styles.token}${!isTappable ? ` ${styles.inert}` : ""}${isShaking ? ` ${styles.shaking}` : ""}`;

  return (
    <button
      type="button"
      className={className}
      onClick={isTappable ? handleClick : undefined}
      onAnimationEnd={handleAnimationEnd}
      data-testid={`token-${tile.id}`}
      data-tile-id={tile.id}
    >
      {display}
    </button>
  );
}
