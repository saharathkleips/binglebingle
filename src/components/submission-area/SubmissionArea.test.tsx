import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { SubmissionArea } from "./SubmissionArea";
import { Pool } from "../pool/Pool";
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

async function renderWithPool(word: string) {
  const gameState = createInitialGameState(createWord(word)!);
  return render(
    <GameProvider initialState={gameState}>
      <Pool />
      <SubmissionArea />
    </GameProvider>,
  );
}

/** Dispatch a sequence of pointer events directly on a DOM element. */
function pointerSequence(
  element: Element,
  events: Array<{ type: string; clientX: number; clientY: number }>,
) {
  for (const { type, clientX, clientY } of events) {
    element.dispatchEvent(
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

describe("SubmissionArea slot tap", () => {
  it("empties a filled slot when tapped", async () => {
    // 가 → ㄱ(tile-0), ㅏ(tile-1); drag tile-0 into slot-0, then tap slot-0 to remove
    const screen = await renderWithPool("가");

    const tile = screen.getByTestId("tile-0").element();
    const slot = screen.getByTestId("slot-0").element();
    const slotRect = slot.getBoundingClientRect();
    const slotCenterX = slotRect.left + slotRect.width / 2;
    const slotCenterY = slotRect.top + slotRect.height / 2;

    pointerSequence(tile, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: slotCenterX, clientY: slotCenterY },
      { type: "pointerup", clientX: slotCenterX, clientY: slotCenterY },
    ]);

    await expect.poll(() => screen.getByTestId("slot-0").element().textContent).not.toBe("");

    await screen.getByTestId("slot-0").click();

    await expect.poll(() => screen.getByTestId("slot-0").element().textContent).toBe("");
  });
});
