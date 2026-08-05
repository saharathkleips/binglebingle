import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { dragToElementCenter } from "../../test-utils/pointer-events";
import { getPoolTile } from "../../test-utils/dom-selectors";
import { Pool } from "./Pool";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { DATA_TILE_ID_ATTRIBUTE, dataAttributeSelector } from "../../lib/dom-data-attributes";
import { createWord } from "../../lib/word";

async function renderPool(word: string) {
  const gameState = createInitialGameState(createWord(word)!);
  return render(
    <GameProvider initialState={gameState}>
      <Pool />
    </GameProvider>,
  );
}

function poolTiles(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll(dataAttributeSelector(DATA_TILE_ID_ATTRIBUTE)),
  ).filter((element): element is HTMLElement => element instanceof HTMLElement);
}

describe("Pool", () => {
  it("renders a tile for each tile in the pool", async () => {
    const screen = await renderPool("가");
    await expect.element(screen.getByRole("group", { name: "자모 조각 모음" })).toBeInTheDocument();
    expect(poolTiles().length).toBe(2);
  });

  it("renders pool tiles for a multi-character word", async () => {
    const screen = await renderPool("한글");
    await expect.element(screen.getByRole("group", { name: "자모 조각 모음" })).toBeInTheDocument();
    expect(poolTiles().length).toBe(6);
  });
});

describe("Pool tap", () => {
  it("rotates a rotatable tile on tap", async () => {
    const screen = await renderPool("가");
    const tileElement = getPoolTile(0);
    const textBefore = tileElement.textContent;
    await screen.getByRole("button", { name: "ㄱ" }).click();
    await expect.poll(() => getPoolTile(0).textContent).not.toBe(textBefore);
  });

  it("decomposes a composable tile on tap after it has been composed", async () => {
    const screen = await renderPool("나가");

    const consonantTiles = poolTiles().filter((tile) => tile.textContent === "ㄱ");
    dragToElementCenter(consonantTiles[0]!, consonantTiles[1]!);

    await expect.poll(() => poolTiles().length).toBe(3);

    await screen.getByRole("button", { name: "ㄲ" }).click();
    await expect.poll(() => poolTiles().length).toBe(4);
  });
});

describe("Pool drag", () => {
  it("keeps pool unchanged when compose is invalid", async () => {
    await renderPool("나가");
    const tilesBefore = poolTiles().length;

    dragToElementCenter(getPoolTile(1), getPoolTile(3));

    expect(poolTiles().length).toBe(tilesBefore);
  });

  it("composes tiles and reduces pool count when compose is valid", async () => {
    await renderPool("가");
    const tilesBefore = poolTiles().length;
    const source = poolTiles().find((tile) => tile.textContent === "ㄱ")!;
    const target = poolTiles().find((tile) => tile.textContent === "ㅏ")!;
    dragToElementCenter(source, target);

    await expect.poll(() => poolTiles().length).toBe(tilesBefore - 1);
  });
});
