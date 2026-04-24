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
    isRejected: false,
    onTap: vi.fn(),
    onDropOnTile: vi.fn(),
    onDropOnSlot: vi.fn(),
    onRejectedEnd: vi.fn(),
    ...overrides,
  };
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

  it("applies shaking class when isRejected is true", async () => {
    const screen = await render(<Tile {...tileProps({ isRejected: true })} />);
    await expect.element(screen.getByTestId("tile-0")).toHaveClass(styles.shaking!);
  });

  it("does not apply shaking class when isRejected is false", async () => {
    const screen = await render(<Tile {...tileProps({ isRejected: false })} />);
    await expect.element(screen.getByTestId("tile-0")).not.toHaveClass(styles.shaking!);
  });

  it("calls onRejectedEnd after animation ends", async () => {
    const onRejectedEnd = vi.fn();
    const screen = await render(<Tile {...tileProps({ isRejected: true, onRejectedEnd })} />);
    screen
      .getByTestId("tile-0")
      .element()
      .dispatchEvent(new Event("animationend", { bubbles: true }));
    expect(onRejectedEnd).toHaveBeenCalledOnce();
  });
});

describe("Tile drag", () => {
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

    dragSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: slotCenterX, clientY: slotCenterY },
      { type: "pointerup", clientX: slotCenterX, clientY: slotCenterY },
    ]);

    await expect.poll(() => onDropOnSlot.mock.calls.length).toBe(1);
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
          isRejected={false}
          onTap={vi.fn()}
          onDropOnTile={vi.fn()}
          onDropOnSlot={vi.fn()}
          onRejectedEnd={vi.fn()}
        />
      </div>,
    );
    const tileElement = screen.getByTestId("tile-0").element();
    const targetRect = screen.getByTestId("tile-1").element().getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    dragSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: targetCenterX, clientY: targetCenterY },
      { type: "pointerup", clientX: targetCenterX, clientY: targetCenterY },
    ]);

    await expect.poll(() => onDropOnTile.mock.calls.length).toBe(1);
    expect(onDropOnTile).toHaveBeenCalledWith(1);
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
    const slotRect = screen.getByTestId("slot-0").element().getBoundingClientRect();
    const slotCenterX = slotRect.left + slotRect.width / 2;
    const slotCenterY = slotRect.top + slotRect.height / 2;

    dragSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: slotCenterX, clientY: slotCenterY },
    ]);

    await expect.element(screen.getByTestId("slot-0")).toHaveAttribute("data-drag-over", "true");

    dragSequence(tileElement, [{ type: "pointerup", clientX: slotCenterX, clientY: slotCenterY }]);
  });
});
