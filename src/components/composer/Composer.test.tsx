import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Composer } from "./Composer";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";

async function renderComposer(word: string) {
  const gameState = createInitialGameState(createWord(word)!);
  return render(
    <GameProvider initialState={gameState}>
      <Composer />
    </GameProvider>,
  );
}

describe("Composer", () => {
  it("renders one slot per character in the target word", async () => {
    const screen = await renderComposer("한글");
    expect(
      screen
        .getByTestId("composer")
        .getByTestId(/^slot-/)
        .elements().length,
    ).toBe(2);
  });

  it("renders a submit button", async () => {
    const screen = await renderComposer("가");
    await expect.element(screen.getByTestId("submit-button")).toBeInTheDocument();
  });
});
