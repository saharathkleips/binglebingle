import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { SubmissionArea } from "./SubmissionArea";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";

async function renderSubmissionArea(word: string) {
  const gameState = createInitialGameState(createWord(word)!);
  return render(
    <GameProvider initialState={gameState}>
      <SubmissionArea />
    </GameProvider>,
  );
}

describe("SubmissionArea", () => {
  it("renders one slot per character in the target word", async () => {
    const screen = await renderSubmissionArea("한글");
    expect(
      screen
        .getByTestId("submission-area")
        .getByTestId(/^slot-/)
        .elements().length,
    ).toBe(2);
  });

  it("renders a submission button", async () => {
    const screen = await renderSubmissionArea("가");
    await expect.element(screen.getByTestId("submission-button")).toBeInTheDocument();
  });
});
