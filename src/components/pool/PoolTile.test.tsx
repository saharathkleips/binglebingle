import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { dragSequence, dragToElementCenter } from "../../test-utils/pointer-events";
import { PoolTile } from "./PoolTile";
import { character } from "../../lib/character";
import {
  clearTileEntranceSnapBackSuppressions,
  hasPendingTileSnapBack,
  popPendingTileSnapBack,
} from "../../lib/animation/drag-animations";
import type { Tile as TileType } from "../../context/game";

function tile(id: number, char: ReturnType<typeof character>): TileType {
  return { id, character: char! };
}

function tileProps(
  overrides: Partial<React.ComponentProps<typeof PoolTile>> = {},
): React.ComponentProps<typeof PoolTile> {
  return {
    tile: tile(0, character({ choseong: "ㄱ" })),
    isTappable: false,
    onTap: vi.fn(),
    onDropOnTile: vi.fn(() => true),
    onDropOnSlot: vi.fn(() => true),
    ...overrides,
  };
}

describe("PoolTile", () => {
  it("displays the resolved character", async () => {
    const screen = await render(<PoolTile {...tileProps()} />);
    await expect.element(screen.getByTestId("tile-0")).toHaveTextContent("ㄱ");
  });

  it("calls onTap on tap when isTappable", async () => {
    const onTap = vi.fn();
    const screen = await render(<PoolTile {...tileProps({ isTappable: true, onTap })} />);
    await screen.getByTestId("tile-0").click();
    expect(onTap).toHaveBeenCalledOnce();
  });

  it("does not call onTap on tap when not isTappable", async () => {
    const onTap = vi.fn();
    const screen = await render(<PoolTile {...tileProps({ isTappable: false, onTap })} />);
    await screen.getByTestId("tile-0").click();
    expect(onTap).not.toHaveBeenCalled();
  });

  it("keeps the interactive affordance when not isTappable because pool tiles are draggable", async () => {
    const screen = await render(<PoolTile {...tileProps({ isTappable: false })} />);

    await expect
      .element(screen.getByTestId("tile-0"))
      .toHaveAttribute("data-tile-interactive", "true");
  });
});

describe("PoolTile drag", () => {
  it("calls onDropOnSlot with slotIndex and records source snap-back when dropped on a slot", async () => {
    const onDropOnSlot = vi.fn(() => true);
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <PoolTile {...tileProps({ onDropOnSlot })} />
        <button data-slot-index="1" data-testid="slot-1">
          _
        </button>
      </div>,
    );
    const tileElement = screen.getByTestId("tile-0").element();
    const slotElement = screen.getByTestId("slot-1").element();

    dragToElementCenter(tileElement, slotElement);

    expect(hasPendingTileSnapBack(0)).toBe(true);
    popPendingTileSnapBack(0)?.clone.remove();
    clearTileEntranceSnapBackSuppressions([0]);
    await expect.poll(() => onDropOnSlot.mock.calls.length).toBe(1);
    expect(onDropOnSlot).toHaveBeenCalledWith(1);
  });

  it("calls onDropOnTile with targetId when dropped on another tile", async () => {
    const onDropOnTile = vi.fn(() => true);
    const targetTile = tile(1, character({ jungseong: "ㅏ" })!);
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <PoolTile {...tileProps({ onDropOnTile })} />
        <PoolTile
          tile={targetTile}
          isTappable={false}
          onTap={vi.fn()}
          onDropOnTile={vi.fn(() => true)}
          onDropOnSlot={vi.fn(() => true)}
        />
      </div>,
    );
    const tileElement = screen.getByTestId("tile-0").element();
    const targetElement = screen.getByTestId("tile-1").element();

    dragToElementCenter(tileElement, targetElement);

    await expect.poll(() => onDropOnTile.mock.calls.length).toBe(1);
    expect(onDropOnTile).toHaveBeenCalledWith(1);
  });

  it("does not call onDropOnSlot or onDropOnTile when dropped on empty space", async () => {
    // Drag a tile and release over empty space (no valid drop target in view).
    // findDropTarget returns null — neither callback fires.
    const onDropOnSlot = vi.fn(() => true);
    const onDropOnTile = vi.fn(() => true);
    const screen = await render(<PoolTile {...tileProps({ onDropOnSlot, onDropOnTile })} />);
    const tileElement = screen.getByTestId("tile-0").element();

    dragSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointerup", clientX: 10, clientY: 0 },
    ]);

    expect(onDropOnSlot).not.toHaveBeenCalled();
    expect(onDropOnTile).not.toHaveBeenCalled();
  });

  it("sets merge preview text on the dragged tile during a valid pool tile hover", async () => {
    const targetTile = tile(1, character({ jungseong: "ㅏ" })!);
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <PoolTile
          {...tileProps({ getDropTargetFeedback: () => ({ canDrop: true, preview: "가" }) })}
        />
        <PoolTile
          tile={targetTile}
          isTappable={false}
          onTap={vi.fn()}
          onDropOnTile={vi.fn(() => true)}
          onDropOnSlot={vi.fn(() => true)}
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
    ]);

    await expect.element(screen.getByTestId("tile-0")).toHaveAttribute("data-drop-preview", "가");
    await expect.element(screen.getByTestId("tile-0")).toHaveTextContent("가");

    dragSequence(tileElement, [
      { type: "pointerup", clientX: targetCenterX, clientY: targetCenterY },
    ]);
    await expect.element(screen.getByTestId("tile-0")).not.toHaveAttribute("data-drop-preview");
    await expect.element(screen.getByTestId("tile-0")).toHaveTextContent("ㄱ");
  });

  it("highlights empty slot drop target during drag", async () => {
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <PoolTile {...tileProps()} />
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

    await expect
      .element(screen.getByTestId("slot-0"))
      .toHaveAttribute("data-drop-slot-target-active", "true");

    dragSequence(tileElement, [{ type: "pointerup", clientX: slotCenterX, clientY: slotCenterY }]);
  });
});
