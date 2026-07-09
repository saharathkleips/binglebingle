import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { dragToElementCenter } from "../../test-utils/pointer-events";
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

describe("Pool tap", () => {
  it("rotates a rotatable tile on tap", async () => {
    // 가 → tile-0=ㄱ (rotatable), tile-1=ㅏ; tapping ㄱ rotates it to ㄴ
    const screen = await renderPool("가");
    const tileElement = screen.getByTestId("tile-0").element();
    const textBefore = tileElement.textContent;
    await screen.getByTestId("tile-0").click();
    await expect
      .poll(() => screen.getByTestId("tile-0").element().textContent)
      .not.toBe(textBefore);
  });

  it("decomposes a composable tile on tap after it has been composed", async () => {
    // 나가 → pool [ㄱ(0), ㅏ(1), ㄱ(2), ㅏ(3)] (ㄴ normalizes to ㄱ).
    // First compose tile-0 (ㄱ) onto tile-2 (ㄱ) → tile-2 becomes ㄲ (3 tiles total).
    // Then tap tile-2 (ㄲ) to decompose → back to 4 tiles.
    const screen = await renderPool("나가");

    const tile0 = screen.getByTestId("tile-0").element();
    const tile2 = screen.getByTestId("tile-2").element();
    // Compose: drag tile-0 onto tile-2 (ㄱ+ㄱ→ㄲ)
    dragToElementCenter(tile0, tile2);

    await expect.poll(() => screen.getByTestId(/^tile-/).elements().length).toBe(3);

    // Decompose: tap tile-2 (now ㄲ)
    await screen.getByTestId("tile-2").click();
    await expect.poll(() => screen.getByTestId(/^tile-/).elements().length).toBe(4);
  });
});

describe("Pool drag", () => {
  it("keeps pool unchanged when compose is invalid", async () => {
    // 나가 → pool [ㄱ(0), ㅏ(1), ㄱ(2), ㅏ(3)].
    // Drag tile-1 (ㅏ) onto tile-3 (ㅏ): compose(ㅏ, ㅏ)=null.
    const screen = await renderPool("나가");
    const tilesBefore = screen.getByTestId(/^tile-/).elements().length;

    const source = screen.getByTestId("tile-1").element();
    const target = screen.getByTestId("tile-3").element();
    dragToElementCenter(source, target);

    expect(screen.getByTestId(/^tile-/).elements().length).toBe(tilesBefore);
  });

  it("composes tiles and reduces pool count when compose is valid", async () => {
    // 가 → ㄱ + ㅏ; dragging ㄱ onto ㅏ should produce 가 (one tile)
    const screen = await renderPool("가");
    const tilesBefore = screen.getByTestId(/^tile-/).elements().length;
    const source = screen
      .getByTestId(/^tile-/)
      .elements()
      .find((tile) => tile.textContent === "ㄱ")!;
    const target = screen
      .getByTestId(/^tile-/)
      .elements()
      .find((tile) => tile.textContent === "ㅏ")!;
    dragToElementCenter(source, target);

    // Two tiles compose into one → count decreases by 1
    await expect.poll(() => screen.getByTestId(/^tile-/).elements().length).toBe(tilesBefore - 1);
  });
});
