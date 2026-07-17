import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { pointerSequence } from "../../test-utils/pointer-events";
import { getPoolTile, getSubmissionSlot } from "../../test-utils/dom-selectors";
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

function submissionSlots(): HTMLElement[] {
  return Array.from(document.querySelectorAll("[data-slot-index][data-slot-hitbox]")).filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
}

describe("SubmissionArea", () => {
  it("renders one slot per character in the target word", async () => {
    const screen = await renderSubmissionArea("한글");
    await expect
      .element(screen.getByRole("region", { name: "Submission area" }))
      .toBeInTheDocument();
    expect(submissionSlots().length).toBe(2);
  });

  it("renders a submission button", async () => {
    const screen = await renderSubmissionArea("가");
    await expect.element(screen.getByRole("button", { name: "도전" })).toBeInTheDocument();
  });
});

describe("SubmissionArea slot tap", () => {
  it("empties a filled slot when tapped", async () => {
    const screen = await renderWithPool("가");

    const tile = getPoolTile(0);
    const slot = getSubmissionSlot(0);
    const slotRect = slot.getBoundingClientRect();
    const slotCenterX = slotRect.left + slotRect.width / 2;
    const slotCenterY = slotRect.top + slotRect.height / 2;

    pointerSequence(tile, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: slotCenterX, clientY: slotCenterY },
      { type: "pointerup", clientX: slotCenterX, clientY: slotCenterY },
    ]);

    await expect.poll(() => getSubmissionSlot(0).textContent).not.toBe("");

    await screen.getByRole("button", { name: "ㄱ" }).click();

    await expect.poll(() => getSubmissionSlot(0).textContent).toBe("");
  });
});
