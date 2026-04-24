import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Pool } from "./Pool";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";
import styles from "./Tile.module.css";

async function renderPool(word: string) {
  const gameState = createInitialGameState(createWord(word)!);
  return render(
    <GameProvider initialState={gameState}>
      <Pool />
    </GameProvider>,
  );
}

/**
 * Dispatch a drag sequence via GSAP Draggable's event model:
 * pointerdown on the element, pointermove/pointerup on document.
 */
function dragSequence(
  element: Element,
  events: Array<{ type: string; clientX: number; clientY: number }>,
) {
  for (const { type, clientX, clientY } of events) {
    const target = type === "pointerdown" ? element : document;
    target.dispatchEvent(
      new PointerEvent(type, {
        clientX,
        clientY,
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        isPrimary: true,
      }),
    );
  }
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
    const tile2Rect = tile2.getBoundingClientRect();
    const tile2CenterX = tile2Rect.left + tile2Rect.width / 2;
    const tile2CenterY = tile2Rect.top + tile2Rect.height / 2;

    // Compose: drag tile-0 onto tile-2 (ㄱ+ㄱ→ㄲ)
    dragSequence(tile0, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: tile2CenterX, clientY: tile2CenterY },
      { type: "pointerup", clientX: tile2CenterX, clientY: tile2CenterY },
    ]);

    await expect.poll(() => screen.getByTestId(/^tile-/).elements().length).toBe(3);

    // Decompose: tap tile-2 (now ㄲ)
    await screen.getByTestId("tile-2").click();
    await expect.poll(() => screen.getByTestId(/^tile-/).elements().length).toBe(4);
  });
});

describe("Pool drag", () => {
  it("shows shake on source tile when compose is invalid", async () => {
    // 나가 → pool [ㄱ(0), ㅏ(1), ㄱ(2), ㅏ(3)].
    // Drag tile-1 (ㅏ) onto tile-3 (ㅏ): compose(ㅏ, ㅏ)=null → tile-1 shakes.
    const screen = await renderPool("나가");

    const source = screen.getByTestId("tile-1").element();
    const target = screen.getByTestId("tile-3").element();
    const targetRect = target.getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    dragSequence(source, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: targetCenterX, clientY: targetCenterY },
      { type: "pointerup", clientX: targetCenterX, clientY: targetCenterY },
    ]);

    await expect.element(screen.getByTestId("tile-1")).toHaveClass(styles.shaking!);
  });

  it("shakes both tiles independently when two compose attempts are rejected in quick succession", async () => {
    // 나가 → pool [ㄱ(0), ㅏ(1), ㄱ(2), ㅏ(3)].
    // Drag tile-1 (ㅏ) onto tile-3 (ㅏ) → rejected, tile-1 shakes.
    // Before animation ends, drag tile-3 (ㅏ) onto tile-1 (ㅏ) → rejected, tile-3 also shakes.
    // Both tiles should be shaking simultaneously.
    const screen = await renderPool("나가");

    const tile1 = screen.getByTestId("tile-1").element();
    const tile3 = screen.getByTestId("tile-3").element();

    function dragOnto(source: Element, target: Element) {
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      dragSequence(source, [
        { type: "pointerdown", clientX: 0, clientY: 0 },
        { type: "pointermove", clientX: 10, clientY: 0 },
        { type: "pointermove", clientX: centerX, clientY: centerY },
        { type: "pointerup", clientX: centerX, clientY: centerY },
      ]);
    }

    dragOnto(tile1, tile3);
    await expect.element(screen.getByTestId("tile-1")).toHaveClass(styles.shaking!);

    dragOnto(tile3, tile1);
    await expect.element(screen.getByTestId("tile-1")).toHaveClass(styles.shaking!);
    await expect.element(screen.getByTestId("tile-3")).toHaveClass(styles.shaking!);
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
    const targetRect = target.getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    dragSequence(source, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: targetCenterX, clientY: targetCenterY },
      { type: "pointerup", clientX: targetCenterX, clientY: targetCenterY },
    ]);

    // Two tiles compose into one → count decreases by 1
    await expect.poll(() => screen.getByTestId(/^tile-/).elements().length).toBe(tilesBefore - 1);
  });
});
