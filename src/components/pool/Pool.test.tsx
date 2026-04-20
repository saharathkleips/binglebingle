import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Pool } from "./Pool";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";

async function renderPool(word: string) {
  const gameState = createInitialGameState(createWord(word)!);
  return render(
    <GameProvider initialState={gameState}>
      <Pool />
    </GameProvider>,
  );
}

describe("Pool", () => {
  it("renders a tile for each tile in the pool", async () => {
    const screen = await renderPool("가");
    // 가 decomposes to ㄱ + ㅏ = 2 pool tiles
    expect(screen.getByTestId(/^tile-/).elements().length).toBe(2);
  });

  it("renders pool tiles for a multi-character word", async () => {
    const screen = await renderPool("한글");
    // 한 → ㅎ, ㅏ, ㄴ; 글 → ㄱ, ㅡ, ㄹ = 6 pool tiles (after normalization)
    expect(screen.getByTestId(/^tile-/).elements().length).toBe(6);
  });
});
