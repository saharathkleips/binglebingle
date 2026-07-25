import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { pointerSequence } from "../../test-utils/pointer-events";
import {
  getHistoryRow,
  getHistoryCards,
  getPoolTile,
  getSubmissionSlot,
} from "../../test-utils/dom-selectors";
import { HistoryArea } from "./HistoryArea";
import { Pool } from "../pool/Pool";
import { SubmissionArea } from "../submission-area/SubmissionArea";
import { GameProvider } from "../../context/game/GameContext";
import type { GameState } from "../../context/game";
import type { CharacterResult, GuessRecord } from "../../lib/engine";
import { character } from "../../lib/character";
import { DATA_HISTORY_CARD_ATTRIBUTE } from "../../lib/dom-data-attributes";
import { createWord } from "../../lib/word";

async function renderHistoryArea(history: readonly GuessRecord[]) {
  const state: GameState = {
    targetWord: createWord("가")!,
    pool: [],
    submission: [{ state: "EMPTY" }],
    history,
  };
  return render(
    <GameProvider initialState={state}>
      <HistoryArea />
    </GameProvider>,
  );
}

function createGuessRecord(value: string, result: CharacterResult): GuessRecord {
  return [{ character: character(value)!, result }];
}

describe("HistoryArea", () => {
  it("renders an empty history region when history is empty", async () => {
    const screen = await renderHistoryArea([]);
    await expect.element(screen.getByRole("region", { name: "Guess history" })).toBeInTheDocument();
    expect(getHistoryCards().length).toBe(0);
  });

  it("renders one row per guess record", async () => {
    await renderHistoryArea([createGuessRecord("가", "CORRECT")]);
    await expect.element(getHistoryRow(0)).toBeInTheDocument();
    expect(getHistoryRow(0).querySelectorAll(`[${DATA_HISTORY_CARD_ATTRIBUTE}]`).length).toBe(1);
  });

  it("renders multiple rows for multiple guesses", async () => {
    await renderHistoryArea([
      createGuessRecord("나", "ABSENT"),
      createGuessRecord("가", "CORRECT"),
    ]);
    await expect.element(getHistoryRow(0)).toBeInTheDocument();
    await expect.element(getHistoryRow(1)).toBeInTheDocument();
  });
});

describe("HistoryArea reveal animation", () => {
  it("shows history row after a guess is submitted", async () => {
    const gameState: GameState = {
      targetWord: createWord("가")!,
      pool: [{ id: 0, character: character("가")! }],
      submission: [{ state: "EMPTY" }],
      history: [],
    };
    const screen = await render(
      <GameProvider initialState={gameState}>
        <Pool />
        <SubmissionArea />
        <HistoryArea />
      </GameProvider>,
    );

    const tile0 = getPoolTile(0);
    const slot0 = getSubmissionSlot(0);
    const slot0Rect = slot0.getBoundingClientRect();
    pointerSequence(tile0, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      {
        type: "pointermove",
        clientX: slot0Rect.left + slot0Rect.width / 2,
        clientY: slot0Rect.top + slot0Rect.height / 2,
      },
      {
        type: "pointerup",
        clientX: slot0Rect.left + slot0Rect.width / 2,
        clientY: slot0Rect.top + slot0Rect.height / 2,
      },
    ]);

    await expect
      .poll(() => !screen.getByRole("button", { name: "도전" }).element().hasAttribute("disabled"))
      .toBeTruthy();
    await screen.getByRole("button", { name: "도전" }).click();

    await expect.poll(() => getHistoryCards().length).toBe(1);
    await expect.element(getHistoryRow(0)).toBeInTheDocument();
  });
});
