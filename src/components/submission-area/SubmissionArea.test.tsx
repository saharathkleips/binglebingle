import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { dragToElementCenter, pointerSequence } from "../../test-utils/pointer-events";
import { getPoolTile, getSubmissionSlot } from "../../test-utils/dom-selectors";
import { SubmissionArea } from "./SubmissionArea";
import { Pool } from "../pool/Pool";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import {
  DATA_POOL_ATTRIBUTE,
  DATA_SLOT_HITBOX_ATTRIBUTE,
  DATA_SLOT_INDEX_ATTRIBUTE,
  dataAttributeSelector,
} from "../../lib/dom-data-attributes";
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
  return Array.from(
    document.querySelectorAll(
      `${dataAttributeSelector(DATA_SLOT_INDEX_ATTRIBUTE)}${dataAttributeSelector(
        DATA_SLOT_HITBOX_ATTRIBUTE,
      )}`,
    ),
  ).filter((element): element is HTMLElement => element instanceof HTMLElement);
}

describe("SubmissionArea", () => {
  it("renders one slot per character in the target word", async () => {
    const screen = await renderSubmissionArea("한글");
    await expect.element(screen.getByRole("region", { name: "제출 영역" })).toBeInTheDocument();
    expect(submissionSlots().length).toBe(2);
  });

  it("renders a submission button", async () => {
    const screen = await renderSubmissionArea("가");
    await expect.element(screen.getByRole("button", { name: "도전" })).toBeInTheDocument();
  });
});

describe("SubmissionArea slot interactions", () => {
  it("moves a filled slot onto another submission slot", async () => {
    await renderWithPool("가나");

    dragToElementCenter(getPoolTile(0), getSubmissionSlot(0));
    await expect.poll(() => getSubmissionSlot(0).textContent).not.toBe("");
    dragToElementCenter(getPoolTile(1), getSubmissionSlot(1));
    await expect.poll(() => getSubmissionSlot(1).textContent).not.toBe("");

    const firstSlotText = getSubmissionSlot(0).textContent;
    const secondSlotText = getSubmissionSlot(1).textContent;
    dragToElementCenter(getSubmissionSlot(0), getSubmissionSlot(1));

    await expect.poll(() => getSubmissionSlot(1).textContent).toBe(firstSlotText);
    expect(getSubmissionSlot(0).textContent).toBe(secondSlotText);
  });

  it("returns a filled slot to the pool when dropped on the pool", async () => {
    await renderWithPool("가");

    dragToElementCenter(getPoolTile(0), getSubmissionSlot(0));
    await expect.poll(() => getSubmissionSlot(0).textContent).not.toBe("");
    const pool = document.querySelector(dataAttributeSelector(DATA_POOL_ATTRIBUTE));
    if (!(pool instanceof HTMLElement)) throw new Error("Expected pool element.");

    dragToElementCenter(getSubmissionSlot(0), pool);

    await expect.poll(() => getSubmissionSlot(0).textContent).toBe("");
    await expect.poll(() => getPoolTile(0).textContent).not.toBe("");
  });

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
