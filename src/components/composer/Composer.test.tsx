import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Composer } from "./Composer";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";

function renderComposer(word: string) {
  const gameState = createInitialGameState(createWord(word)!);
  return render(
    <GameProvider initialState={gameState}>
      <Composer />
    </GameProvider>,
  );
}

describe("Composer", () => {
  it("renders one slot per character in the target word", () => {
    renderComposer("한글");
    const composer = screen.getByTestId("composer");
    const slots = composer.querySelectorAll("[data-testid^='slot-']");
    expect(slots.length).toBe(2);
  });

  it("renders a submit button", () => {
    renderComposer("가");
    expect(screen.getByTestId("submit-button")).toBeDefined();
  });
});
