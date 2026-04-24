import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { HistoryArea } from "./HistoryArea";
import { Pool } from "../pool/Pool";
import { SubmissionArea } from "../submission-area/SubmissionArea";
import { GameProvider } from "../../context/game/GameContext";
import type { GameState } from "../../context/game";
import type { GuessRecord } from "../../lib/engine";
import { character } from "../../lib/character";
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

describe("HistoryArea", () => {
  it("renders nothing when history is empty", async () => {
    const screen = await renderHistoryArea([]);
    await expect.element(screen.getByTestId("history-area")).not.toBeInTheDocument();
  });

  it("renders one row per guess record", async () => {
    const guess: GuessRecord = [{ character: character("가")!, result: "CORRECT" }];
    const screen = await renderHistoryArea([guess]);
    await expect.element(screen.getByTestId("history-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("history-row-0").getByTestId("history-tile").elements().length).toBe(
      1,
    );
  });

  it("renders multiple rows for multiple guesses", async () => {
    const guess1: GuessRecord = [{ character: character("나")!, result: "ABSENT" }];
    const guess2: GuessRecord = [{ character: character("가")!, result: "CORRECT" }];
    const screen = await renderHistoryArea([guess1, guess2]);
    await expect.element(screen.getByTestId("history-row-0")).toBeInTheDocument();
    await expect.element(screen.getByTestId("history-row-1")).toBeInTheDocument();
  });
});

/** Dispatch pointer events on an element; events bubble to document for GSAP Draggable. */
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

describe("HistoryArea reveal animation", () => {
  it("shows history row after a guess is submitted", async () => {
    // Start with 가 (a complete syllable) already in the pool so the submit
    // button enables as soon as the tile lands in slot-0.
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

    const tile0 = screen.getByTestId("tile-0").element();
    const slot0 = screen.getByTestId("slot-0").element();
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

    // Wait for submit button to enable, then submit
    await expect
      .poll(() => !screen.getByTestId("submission-button").element().hasAttribute("disabled"))
      .toBeTruthy();
    await screen.getByTestId("submission-button").click();

    // animateHistoryRowReveal fires here; assert the row appears
    await expect.element(screen.getByTestId("history-row-0")).toBeInTheDocument();
  });
});
