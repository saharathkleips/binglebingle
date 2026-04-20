import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Tile } from "./Tile";
import { character } from "../../lib/character";
import type { Tile as TileType, GameAction } from "../../context/game";
import styles from "./Tile.module.css";

function tile(id: number, char: ReturnType<typeof character>): TileType {
  return { id, character: char! };
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

describe("Tile", () => {
  it("displays the resolved character", async () => {
    const dispatch = vi.fn();
    const screen = await render(
      <Tile tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />,
    );
    await expect.element(screen.getByTestId("tile-0")).toHaveTextContent("ㄱ");
  });

  it("dispatches CHARACTER_ROTATE_NEXT on tap when rotatable", async () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const screen = await render(
      <Tile tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />,
    );
    await screen.getByTestId("tile-0").click();
    expect(dispatch).toHaveBeenCalledWith({
      type: "CHARACTER_ROTATE_NEXT",
      payload: { tileId: 0 },
    });
  });

  it("dispatches CHARACTER_DECOMPOSE on tap when decomposable but not rotatable", async () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    // ㄲ is a double consonant — not rotatable but decomposable into ㄱ+ㄱ
    const screen = await render(
      <Tile tile={tile(1, character({ choseong: "ㄲ" }))} dispatch={dispatch} />,
    );
    await screen.getByTestId("tile-1").click();
    expect(dispatch).toHaveBeenCalledWith({
      type: "CHARACTER_DECOMPOSE",
      payload: { tileId: 1 },
    });
  });

  it("does not dispatch on tap when inert", async () => {
    const dispatch = vi.fn();
    // ㅁ is not rotatable and not decomposable
    const screen = await render(
      <Tile tile={tile(2, character({ choseong: "ㅁ" }))} dispatch={dispatch} />,
    );
    await screen.getByTestId("tile-2").click();
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("Tile drag", () => {
  it("does not dispatch on movement below the 4px threshold", async () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const screen = await render(
      <Tile tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />,
    );
    const element = screen.getByTestId("tile-0").element();

    pointerSequence(element, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 2, clientY: 0 }, // only 2px — below 4px threshold
      { type: "pointerup", clientX: 2, clientY: 0 },
    ]);

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "SUBMISSION_SLOT_INSERT" }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "CHARACTER_COMPOSE" }),
    );
  });

  it("dispatches SUBMISSION_SLOT_INSERT when dropped on a slot", async () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <Tile tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />
        <button data-slot-index="1" data-testid="slot-1">
          _
        </button>
      </div>,
    );
    const tileElement = screen.getByTestId("tile-0").element();
    const slotRect = screen.getByTestId("slot-1").element().getBoundingClientRect();
    const slotCenterX = slotRect.left + slotRect.width / 2;
    const slotCenterY = slotRect.top + slotRect.height / 2;

    pointerSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: slotCenterX, clientY: slotCenterY },
      { type: "pointerup", clientX: slotCenterX, clientY: slotCenterY },
    ]);

    expect(dispatch).toHaveBeenCalledWith({
      type: "SUBMISSION_SLOT_INSERT",
      payload: { tileId: 0, slotIndex: 1 },
    });
  });

  it("dispatches CHARACTER_COMPOSE when dropped on a valid target tile", async () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    // ㄱ (choseong) + ㅏ (jungseong) → open syllable 가 — valid compose
    const sourceTile = tile(0, character({ choseong: "ㄱ" })!);
    const targetTile = tile(1, character({ jungseong: "ㅏ" })!);
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <Tile tile={sourceTile} pool={[sourceTile, targetTile]} dispatch={dispatch} />
        <Tile tile={targetTile} pool={[sourceTile, targetTile]} dispatch={dispatch} />
      </div>,
    );
    const tileElement = screen.getByTestId("tile-0").element();
    const targetRect = screen.getByTestId("tile-1").element().getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    pointerSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: targetCenterX, clientY: targetCenterY },
      { type: "pointerup", clientX: targetCenterX, clientY: targetCenterY },
    ]);

    expect(dispatch).toHaveBeenCalledWith({
      type: "CHARACTER_COMPOSE",
      payload: { targetId: 1, incomingId: 0 },
    });
  });

  it("shakes and does not dispatch when dropped on an incompatible tile", async () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    // two open syllables cannot compose
    const sourceTile = tile(0, character({ choseong: "ㄱ", jungseong: "ㅏ" })!);
    const targetTile = tile(1, character({ choseong: "ㄴ", jungseong: "ㅏ" })!);
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <Tile tile={sourceTile} pool={[sourceTile, targetTile]} dispatch={dispatch} />
        <Tile tile={targetTile} pool={[sourceTile, targetTile]} dispatch={dispatch} />
      </div>,
    );
    const tileElement = screen.getByTestId("tile-0").element();
    const targetRect = screen.getByTestId("tile-1").element().getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    pointerSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: targetCenterX, clientY: targetCenterY },
      { type: "pointerup", clientX: targetCenterX, clientY: targetCenterY },
    ]);

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "CHARACTER_COMPOSE" }),
    );
    await expect.element(screen.getByTestId("tile-0")).toHaveClass(styles.shaking!);
  });

  it("suppresses tap action after drag ends", async () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <Tile tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />
        <div data-testid="empty-area" style={{ width: "50px", height: "50px" }} />
      </div>,
    );
    const tileElement = screen.getByTestId("tile-0").element();
    const emptyRect = screen.getByTestId("empty-area").element().getBoundingClientRect();
    const emptyCenterX = emptyRect.left + emptyRect.width / 2;
    const emptyCenterY = emptyRect.top + emptyRect.height / 2;

    pointerSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: emptyCenterX, clientY: emptyCenterY },
      { type: "pointerup", clientX: emptyCenterX, clientY: emptyCenterY },
    ]);

    // Simulate a click that may fire after pointerup in some browsers
    await screen.getByTestId("tile-0").click();
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "CHARACTER_ROTATE_NEXT" }),
    );
  });

  it("highlights drop target with data-drag-over during drag", async () => {
    const dispatch = vi.fn();
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <Tile tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />
        <button data-slot-index="0" data-testid="slot-0">
          _
        </button>
      </div>,
    );
    const tileElement = screen.getByTestId("tile-0").element();
    const slotElement = screen.getByTestId("slot-0").element();
    const slotRect = slotElement.getBoundingClientRect();
    const slotCenterX = slotRect.left + slotRect.width / 2;
    const slotCenterY = slotRect.top + slotRect.height / 2;

    // Start drag (exceed threshold), then move to the slot's coordinates so
    // document.elementsFromPoint returns the slot element.
    pointerSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 }, // exceed 4px threshold
      { type: "pointermove", clientX: slotCenterX, clientY: slotCenterY },
    ]);

    await expect.element(screen.getByTestId("slot-0")).toHaveAttribute("data-drag-over", "true");

    pointerSequence(tileElement, [
      { type: "pointerup", clientX: slotCenterX, clientY: slotCenterY },
    ]);
  });

  it("removes data-drag-over from previous target when drag moves away", async () => {
    const dispatch = vi.fn();
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <Tile tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />
        <button data-slot-index="0" data-testid="slot-0">
          _
        </button>
      </div>,
    );
    const tileElement = screen.getByTestId("tile-0").element();
    const slotElement = screen.getByTestId("slot-0").element();
    const slotRect = slotElement.getBoundingClientRect();
    const slotCenterX = slotRect.left + slotRect.width / 2;
    const slotCenterY = slotRect.top + slotRect.height / 2;

    // Drag over slot — data-drag-over should be set
    pointerSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: slotCenterX, clientY: slotCenterY },
    ]);
    await expect.element(screen.getByTestId("slot-0")).toHaveAttribute("data-drag-over", "true");

    // Pointer moves to empty space — data-drag-over should be removed
    pointerSequence(tileElement, [
      { type: "pointermove", clientX: 0, clientY: 200 }, // off the slot, no element with data-slot-index
    ]);
    await expect.element(screen.getByTestId("slot-0")).not.toHaveAttribute("data-drag-over");

    pointerSequence(tileElement, [{ type: "pointerup", clientX: 0, clientY: 200 }]);
  });
});
