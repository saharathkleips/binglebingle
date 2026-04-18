/**
 * @file Rack.tsx
 *
 * Displays the player's jamo pool as a row of interactive Token tiles.
 */

import { useGame } from "../../context/game/GameContext";
import { Token } from "./Token";
import styles from "./Rack.module.css";

export function Rack() {
  const { state, dispatch } = useGame();

  return (
    <div className={styles.rack} data-testid="rack">
      {state.pool.map((tile) => (
        <Token key={tile.id} tile={tile} pool={state.pool} dispatch={dispatch} />
      ))}
    </div>
  );
}
