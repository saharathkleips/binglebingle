import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Tile } from "./Tile";
import { character } from "../../lib/character";
import type { Tile as TileType } from "../../context/game";
import styles from "./Tile.module.css";

function tile(id: number, char: ReturnType<typeof character>): TileType {
  return { id, character: char! };
}

function tileProps(
  overrides: Partial<React.ComponentProps<typeof Tile>> = {},
): React.ComponentProps<typeof Tile> {
  return {
    tile: tile(0, character({ choseong: "ㄱ" })),
    isTappable: false,
    isInvalid: false,
    onTap: vi.fn(),
    onDropOnTile: vi.fn(),
    onDropOnSlot: vi.fn(),
    onInvalidStateEnd: vi.fn(),
    ...overrides,
  };
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
    const screen = await render(<Tile {...tileProps()} />);
    await expect.element(screen.getByTestId("tile-0")).toHaveTextContent("ㄱ");
  });

  it("calls onTap on tap when isTappable", async () => {
    const onTap = vi.fn();
    const screen = await render(<Tile {...tileProps({ isTappable: true, onTap })} />);
    await screen.getByTestId("tile-0").click();
    expect(onTap).toHaveBeenCalledOnce();
  });

  it("does not call onTap on tap when not isTappable", async () => {
    const onTap = vi.fn();
    const screen = await render(<Tile {...tileProps({ isTappable: false, onTap })} />);
    await screen.getByTestId("tile-0").click();
    expect(onTap).not.toHaveBeenCalled();
  });

  it("applies shaking class when isInvalid is true", async () => {
    const screen = await render(<Tile {...tileProps({ isInvalid: true })} />);
    await expect.element(screen.getByTestId("tile-0")).toHaveClass(styles.shaking!);
  });

  it("does not apply shaking class when isInvalid is false", async () => {
    const screen = await render(<Tile {...tileProps({ isInvalid: false })} />);
    await expect.element(screen.getByTestId("tile-0")).not.toHaveClass(styles.shaking!);
  });

  it("calls onInvalidStateEnd after animation ends", async () => {
    const onInvalidStateEnd = vi.fn();
    const screen = await render(<Tile {...tileProps({ isInvalid: true, onInvalidStateEnd })} />);
    screen
      .getByTestId("tile-0")
      .element()
      .dispatchEvent(new Event("animationend", { bubbles: true }));
    expect(onInvalidStateEnd).toHaveBeenCalledOnce();
  });
});

describe("Tile drag", () => {
  it("does not call any drop callback on movement below the 4px threshold", async () => {
    const onDropOnTile = vi.fn();
    const onDropOnSlot = vi.fn();
    const screen = await render(<Tile {...tileProps({ onDropOnTile, onDropOnSlot })} />);
    const element = screen.getByTestId("tile-0").element();

    pointerSequence(element, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 2, clientY: 0 }, // only 2px — below 4px threshold
      { type: "pointerup", clientX: 2, clientY: 0 },
    ]);

    expect(onDropOnSlot).not.toHaveBeenCalled();
    expect(onDropOnTile).not.toHaveBeenCalled();
  });

  it("calls onDropOnSlot with slotIndex when dropped on a slot", async () => {
    const onDropOnSlot = vi.fn();
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <Tile {...tileProps({ onDropOnSlot })} />
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

    expect(onDropOnSlot).toHaveBeenCalledWith(1);
  });

  it("calls onDropOnTile with targetId when dropped on another tile", async () => {
    const onDropOnTile = vi.fn();
    const targetTile = tile(1, character({ jungseong: "ㅏ" })!);
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <Tile {...tileProps({ onDropOnTile })} />
        <Tile
          tile={targetTile}
          isTappable={false}
          isInvalid={false}
          onTap={vi.fn()}
          onDropOnTile={vi.fn()}
          onDropOnSlot={vi.fn()}
          onInvalidStateEnd={vi.fn()}
        />
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

    expect(onDropOnTile).toHaveBeenCalledWith(1);
  });

  it("suppresses tap after drag ends", async () => {
    const onTap = vi.fn();
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <Tile {...tileProps({ isTappable: true, onTap })} />
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
    expect(onTap).not.toHaveBeenCalled();
  });

  it("highlights drop target with data-drag-over during drag", async () => {
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <Tile {...tileProps()} />
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
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <Tile {...tileProps()} />
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
