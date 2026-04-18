import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Board } from "./Board";
import { GameProvider } from "../../context/game/GameContext";
import type { GameState } from "../../context/game";
import type { GuessRecord } from "../../lib/engine";
import { character } from "../../lib/character";
import { createWord } from "../../lib/word";

function renderBoard(history: readonly GuessRecord[]) {
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
  it("renders nothing when history is empty", () => {
    renderBoard([]);
    expect(screen.queryByTestId("board")).toBeNull();
  });

  it("renders one row per guess record", () => {
    const guess: GuessRecord = [{ character: character("가")!, result: "CORRECT" }];
    renderBoard([guess]);
    expect(screen.getByTestId("board-row-0")).toBeDefined();
    expect(
      screen.getByTestId("board-row-0").querySelectorAll("[data-testid='board-tile']").length,
    ).toBe(1);
  });

  it("renders multiple rows for multiple guesses", () => {
    const guess1: GuessRecord = [{ character: character("나")!, result: "ABSENT" }];
    const guess2: GuessRecord = [{ character: character("가")!, result: "CORRECT" }];
    renderBoard([guess1, guess2]);
    expect(screen.getByTestId("board-row-0")).toBeDefined();
    expect(screen.getByTestId("board-row-1")).toBeDefined();
  });
});
