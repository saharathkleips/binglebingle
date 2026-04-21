import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { WinPanel } from "./WinPanel";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";
import { character } from "../../lib/character";
import type { GameState } from "../../context/game";

const WORD = createWord("고양이")!;

function wonState(guessCount: number): GameState {
  const correctGuess = [
    { character: character("고")!, result: "CORRECT" as const },
    { character: character("양")!, result: "CORRECT" as const },
    { character: character("이")!, result: "CORRECT" as const },
  ];
  return {
    ...createInitialGameState(WORD),
    history: Array.from({ length: guessCount }, () => correctGuess),
  };
}

async function renderWinPanel(state: GameState) {
  return render(
    <GameProvider initialState={state}>
      <WinPanel />
    </GameProvider>,
  );
}

describe("WinPanel", () => {
  it("renders the win panel", async () => {
    const screen = await renderWinPanel(wonState(1));
    await expect.element(screen.getByTestId("win-panel")).toBeInTheDocument();
  });

  it("displays the target word", async () => {
    const screen = await renderWinPanel(wonState(1));
    await expect.element(screen.getByText("고양이")).toBeInTheDocument();
  });

  it("displays the guess count when solved in one guess", async () => {
    const screen = await renderWinPanel(wonState(1));
    await expect.element(screen.getByText("1번 만에 맞췄어요")).toBeInTheDocument();
  });

  it("displays the guess count when solved in multiple guesses", async () => {
    const screen = await renderWinPanel(wonState(3));
    await expect.element(screen.getByText("3번 만에 맞췄어요")).toBeInTheDocument();
  });

  it("renders the share button as disabled", async () => {
    const screen = await renderWinPanel(wonState(1));
    await expect.element(screen.getByTestId("share-button")).toBeDisabled();
  });
});
