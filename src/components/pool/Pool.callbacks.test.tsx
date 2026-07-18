import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";
import { Pool } from "./Pool";

vi.mock("./PoolTile", () => ({
  PoolTile: ({
    tile,
    isTappable,
    isRotating,
    isJustComposed,
    isNewlyAdded,
    onTap,
    onDropOnTile,
    onDropOnSlot,
    getDropTargetFeedback,
    onRotatingEnd,
    onComposedEnd,
    onNewlyAddedEnd,
  }: {
    tile: { id: number; character: unknown };
    isTappable: boolean;
    isRotating?: boolean;
    isJustComposed?: boolean;
    isNewlyAdded?: boolean;
    onTap: () => void;
    onDropOnTile: (targetId: number) => boolean;
    onDropOnSlot: (slotIndex: number) => boolean;
    getDropTargetFeedback: (target: Element) => { canDrop: boolean; preview: string | null };
    onRotatingEnd?: () => void;
    onComposedEnd?: () => void;
    onNewlyAddedEnd?: () => void;
  }) => (
    <div data-mock-pool-tile={tile.id}>
      <button type="button" data-tappable={isTappable} onClick={onTap}>
        tap {tile.id}
      </button>
      <button type="button" data-rotating={isRotating} onClick={onRotatingEnd}>
        rotating end {tile.id}
      </button>
      <button type="button" data-composed={isJustComposed} onClick={onComposedEnd}>
        composed end {tile.id}
      </button>
      <button type="button" data-newly-added={isNewlyAdded} onClick={onNewlyAddedEnd}>
        newly added end {tile.id}
      </button>
      <button type="button" onClick={() => onDropOnTile(1)}>
        drop on tile {tile.id}
      </button>
      <button type="button" onClick={() => onDropOnSlot(0)}>
        drop on slot {tile.id}
      </button>
      <button
        type="button"
        onClick={() => {
          const target = document.createElement("div");
          target.setAttribute("data-slot-index", "0");
          target.setAttribute("data-feedback", String(getDropTargetFeedback(target).canDrop));
          document.body.append(target);
        }}
      >
        slot feedback {tile.id}
      </button>
      <button
        type="button"
        onClick={() => {
          const target = document.createElement("div");
          target.setAttribute("data-tile-id", "1");
          const feedback = getDropTargetFeedback(target);
          target.setAttribute("data-feedback-preview", feedback.preview ?? "");
          target.setAttribute("data-feedback", String(feedback.canDrop));
          document.body.append(target);
        }}
      >
        valid feedback {tile.id}
      </button>
      <button
        type="button"
        onClick={() => {
          const target = document.createElement("div");
          target.setAttribute("data-feedback", String(getDropTargetFeedback(target).canDrop));
          document.body.append(target);
        }}
      >
        invalid feedback {tile.id}
      </button>
    </div>
  ),
}));

async function renderPool(word: string) {
  const gameState = createInitialGameState(createWord(word)!);
  return render(
    <GameProvider initialState={gameState}>
      <Pool />
    </GameProvider>,
  );
}

describe("Pool callback wiring", () => {
  it("clears rotation, composition, and newly-added animation state", async () => {
    const screen = await renderPool("가");

    await screen.getByRole("button", { name: "tap 0" }).click();
    await expect
      .element(screen.getByRole("button", { name: "rotating end 0" }))
      .toHaveAttribute("data-rotating", "true");
    await screen.getByRole("button", { name: "rotating end 0" }).click();
    await expect
      .element(screen.getByRole("button", { name: "rotating end 0" }))
      .toHaveAttribute("data-rotating", "false");

    await screen.getByRole("button", { name: "drop on tile 0" }).click();
    await expect
      .element(screen.getByRole("button", { name: "composed end 1" }))
      .toHaveAttribute("data-composed", "true");
    await screen.getByRole("button", { name: "composed end 1" }).click();
    await expect
      .element(screen.getByRole("button", { name: "composed end 1" }))
      .toHaveAttribute("data-composed", "false");

    await screen.getByRole("button", { name: "tap 1" }).click();
    await expect
      .element(screen.getByRole("button", { name: "newly added end 0" }))
      .toHaveAttribute("data-newly-added", "true");
    await screen.getByRole("button", { name: "newly added end 0" }).click();
    await expect
      .element(screen.getByRole("button", { name: "newly added end 0" }))
      .toHaveAttribute("data-newly-added", "false");
  });

  it("accepts slot drops and reports slot/invalid feedback", async () => {
    const screen = await renderPool("가");

    await screen.getByRole("button", { name: "valid feedback 0", exact: true }).click();
    expect(document.querySelector('[data-feedback-preview="가"]')).toBeInstanceOf(HTMLElement);

    await screen.getByRole("button", { name: "drop on slot 0" }).click();
    await expect.element(screen.getByRole("button", { name: "tap 1" })).toBeInTheDocument();

    await screen.getByRole("button", { name: "slot feedback 1" }).click();
    expect(document.querySelector('[data-feedback="true"]')).toBeInstanceOf(HTMLElement);

    await screen.getByRole("button", { name: "invalid feedback 1", exact: true }).click();
    expect(document.querySelector('[data-feedback="false"]')).toBeInstanceOf(HTMLElement);
  });
});
