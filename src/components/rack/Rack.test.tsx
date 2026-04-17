import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Rack } from "./Rack";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";

function renderRack(word: string) {
  const gameState = createInitialGameState(createWord(word)!);
  return render(
    <GameProvider initialState={gameState}>
      <Rack />
    </GameProvider>,
  );
}

describe("Rack", () => {
  it("renders a token for each tile in the pool", () => {
    renderRack("가");
    const rack = screen.getByTestId("rack");
    const tokens = rack.querySelectorAll("[data-testid^='token-']");
    // 가 decomposes to ㄱ + ㅏ = 2 pool tiles
    expect(tokens.length).toBe(2);
  });

  it("renders pool tiles for a multi-character word", () => {
    renderRack("한글");
    const rack = screen.getByTestId("rack");
    const tokens = rack.querySelectorAll("[data-testid^='token-']");
    // 한 → ㅎ, ㅏ, ㄴ; 글 → ㄱ, ㅡ, ㄹ = 6 pool tiles (after normalization)
    expect(tokens.length).toBe(6);
  });
});
