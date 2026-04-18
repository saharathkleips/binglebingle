import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Token } from "./Token";
import { character } from "../../lib/character";
import type { Tile, GameAction } from "../../context/game";

function tile(id: number, char: ReturnType<typeof character>): Tile {
  return { id, character: char! };
}

describe("Token", () => {
  it("displays the resolved character", () => {
    const dispatch = vi.fn();
    render(<Token tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />);
    expect(screen.getByTestId("token-0").textContent).toBe("ㄱ");
  });

  it("dispatches CHARACTER_ROTATE_NEXT on tap when rotatable", () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    render(<Token tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId("token-0"));
    expect(dispatch).toHaveBeenCalledWith({
      type: "CHARACTER_ROTATE_NEXT",
      payload: { tileId: 0 },
    });
  });

  it("dispatches CHARACTER_DECOMPOSE on tap when decomposable but not rotatable", () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    // ㄲ is a double consonant — not rotatable but decomposable into ㄱ+ㄱ
    render(<Token tile={tile(1, character({ choseong: "ㄲ" }))} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId("token-1"));
    expect(dispatch).toHaveBeenCalledWith({
      type: "CHARACTER_DECOMPOSE",
      payload: { tileId: 1 },
    });
  });

  it("does not dispatch on tap when inert", () => {
    const dispatch = vi.fn();
    // ㅁ is not rotatable and not decomposable
    render(<Token tile={tile(2, character({ choseong: "ㅁ" }))} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId("token-2"));
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("Token drag", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not dispatch on movement below the 4px threshold", () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    render(<Token tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />);
    const tokenEl = screen.getByTestId("token-0");

    fireEvent.pointerDown(tokenEl, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(tokenEl, { clientX: 2, clientY: 0 });
    fireEvent.pointerUp(tokenEl, { clientX: 2, clientY: 0 });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "SUBMISSION_SLOT_INSERT" }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "CHARACTER_COMPOSE" }),
    );
  });

  it("dispatches SUBMISSION_SLOT_INSERT when dropped on a slot", () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    render(<Token tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />);
    const tokenEl = screen.getByTestId("token-0");

    const mockSlot = document.createElement("button");
    mockSlot.setAttribute("data-slot-index", "1");
    document.elementsFromPoint = vi.fn().mockReturnValue([mockSlot]);

    fireEvent.pointerDown(tokenEl, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(tokenEl, { clientX: 10, clientY: 0 });
    fireEvent.pointerUp(tokenEl, { clientX: 10, clientY: 0 });

    expect(dispatch).toHaveBeenCalledWith({
      type: "SUBMISSION_SLOT_INSERT",
      payload: { tileId: 0, slotIndex: 1 },
    });
  });

  it("dispatches CHARACTER_COMPOSE when dropped on a valid target token", () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    // ㄱ (choseong) + ㅏ (jungseong) → open syllable 가 — valid compose
    const sourceTile = tile(0, character({ choseong: "ㄱ" })!);
    const targetTile = tile(1, character({ jungseong: "ㅏ" })!);
    render(<Token tile={sourceTile} pool={[sourceTile, targetTile]} dispatch={dispatch} />);
    const tokenEl = screen.getByTestId("token-0");

    const mockTarget = document.createElement("button");
    mockTarget.setAttribute("data-tile-id", "1");
    document.elementsFromPoint = vi.fn().mockReturnValue([mockTarget]);

    fireEvent.pointerDown(tokenEl, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(tokenEl, { clientX: 10, clientY: 0 });
    fireEvent.pointerUp(tokenEl, { clientX: 10, clientY: 0 });

    expect(dispatch).toHaveBeenCalledWith({
      type: "CHARACTER_COMPOSE",
      payload: { targetId: 1, incomingId: 0 },
    });
  });

  it("shakes and does not dispatch when dropped on an incompatible token", () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    // two open syllables cannot compose
    const sourceTile = tile(0, character({ choseong: "ㄱ", jungseong: "ㅏ" })!);
    const targetTile = tile(1, character({ choseong: "ㄴ", jungseong: "ㅏ" })!);
    render(<Token tile={sourceTile} pool={[sourceTile, targetTile]} dispatch={dispatch} />);
    const tokenEl = screen.getByTestId("token-0");

    const mockTarget = document.createElement("button");
    mockTarget.setAttribute("data-tile-id", "1");
    document.elementsFromPoint = vi.fn().mockReturnValue([mockTarget]);

    fireEvent.pointerDown(tokenEl, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(tokenEl, { clientX: 10, clientY: 0 });
    fireEvent.pointerUp(tokenEl, { clientX: 10, clientY: 0 });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "CHARACTER_COMPOSE" }),
    );
    expect(tokenEl.className).toContain("shaking");
  });

  it("suppresses tap action after drag ends", () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    render(<Token tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />);
    const tokenEl = screen.getByTestId("token-0");

    document.elementsFromPoint = vi.fn().mockReturnValue([]);

    fireEvent.pointerDown(tokenEl, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(tokenEl, { clientX: 10, clientY: 0 });
    fireEvent.pointerUp(tokenEl, { clientX: 10, clientY: 0 });
    // Synthetic click that would normally fire after pointerup in a real browser
    fireEvent.click(tokenEl);

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "CHARACTER_ROTATE_NEXT" }),
    );
  });

  it("highlights drop target with data-drag-over during drag", () => {
    const dispatch = vi.fn();
    render(<Token tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />);
    const tokenEl = screen.getByTestId("token-0");

    const mockSlot = document.createElement("button");
    mockSlot.setAttribute("data-slot-index", "0");
    document.elementsFromPoint = vi.fn().mockReturnValue([mockSlot]);

    fireEvent.pointerDown(tokenEl, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(tokenEl, { clientX: 10, clientY: 0 });

    expect(mockSlot.getAttribute("data-drag-over")).toBe("true");
  });

  it("removes data-drag-over from previous target when drag moves away", () => {
    const dispatch = vi.fn();
    render(<Token tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />);
    const tokenEl = screen.getByTestId("token-0");

    const mockSlot = document.createElement("button");
    mockSlot.setAttribute("data-slot-index", "0");
    const mockFn = vi.fn<(x: number, y: number) => Element[]>().mockReturnValue([mockSlot]);
    document.elementsFromPoint = mockFn;

    fireEvent.pointerDown(tokenEl, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(tokenEl, { clientX: 10, clientY: 0 });
    expect(mockSlot.getAttribute("data-drag-over")).toBe("true");

    // Pointer moves to empty space
    mockFn.mockReturnValue([]);
    fireEvent.pointerMove(tokenEl, { clientX: 20, clientY: 0 });

    expect(mockSlot.getAttribute("data-drag-over")).toBeNull();
  });
});
