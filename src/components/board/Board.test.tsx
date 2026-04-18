import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Board } from "./Board";
import { GameProvider } from "../../context/game/GameContext";
import type { GameState } from "../../context/game";
import type { GuessRecord } from "../../lib/engine";
import { character } from "../../lib/character";
import { createWord } from "../../lib/word";

async function renderBoard(history: readonly GuessRecord[]) {
  const state: GameState = {
    targetWord: createWord("가")!,
    pool: [],
    submission: [{ state: "EMPTY" }],
    history,
  };
  return render(
    <GameProvider initialState={state}>
      <Board />
    </GameProvider>,
  );
}

describe("Board", () => {
  it("renders nothing when history is empty", async () => {
    const screen = await renderBoard([]);
    await expect.element(screen.getByTestId("board")).not.toBeInTheDocument();
  });

  it("renders one row per guess record", async () => {
    const guess: GuessRecord = [{ character: character("가")!, result: "CORRECT" }];
    const screen = await renderBoard([guess]);
    await expect.element(screen.getByTestId("board-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("board-row-0").getByTestId("board-tile").elements().length).toBe(1);
  });

  it("renders multiple rows for multiple guesses", async () => {
    const guess1: GuessRecord = [{ character: character("나")!, result: "ABSENT" }];
    const guess2: GuessRecord = [{ character: character("가")!, result: "CORRECT" }];
    const screen = await renderBoard([guess1, guess2]);
    await expect.element(screen.getByTestId("board-row-0")).toBeInTheDocument();
    await expect.element(screen.getByTestId("board-row-1")).toBeInTheDocument();
  });
});
