/**
 * @file Pool.tsx
 *
 * Displays the player's jamo pool as a row of interactive Tile tiles.
 */

import { useGame } from "../../context/game/GameContext";
import { Tile } from "./Tile";
import styles from "./Pool.module.css";

export function Pool() {
  const { state, dispatch } = useGame();

  return (
    <div className={styles.pool} data-testid="pool">
      {state.pool.map((tile) => (
        <Tile key={tile.id} tile={tile} pool={state.pool} dispatch={dispatch} />
      ))}
    </div>
  );
}
