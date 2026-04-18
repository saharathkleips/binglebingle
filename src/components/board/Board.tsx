/**
 * @file Board.tsx
 *
 * Displays the guess history as a grid of evaluated tiles.
 */

import { useGame } from "../../context/game/GameContext";
import { BoardTile } from "./BoardTile";
import styles from "./Board.module.css";

export function Board() {
  const { state } = useGame();

  if (state.history.length === 0) return null;

  return (
    <div className={styles.board} data-testid="board">
      {state.history.map((guess, rowIndex) => (
        <div key={rowIndex} className={styles.row} data-testid={`board-row-${rowIndex}`}>
          {guess.map((evaluated, colIndex) => (
            <BoardTile key={colIndex} evaluated={evaluated} />
          ))}
        </div>
      ))}
    </div>
  );
}
