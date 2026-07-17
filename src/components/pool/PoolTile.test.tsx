import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { dragSequence, dragToElementCenter } from "../../test-utils/pointer-events";
import { getSubmissionSlot, getTileById } from "../../test-utils/dom-selectors";
import { PoolTile } from "./PoolTile";
import { character } from "../../lib/character";
import {
  clearTileEntranceSnapBackSuppressions,
  hasPendingTileSnapBack,
  popPendingTileSnapBack,
} from "../../lib/animation/snap-back-animations";
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
    getDropTargetFeedback: vi.fn(() => ({ canDrop: true, preview: null })),
    ...overrides,
  };
}

describe("PoolTile", () => {
  it("displays the resolved character", async () => {
    await render(<PoolTile {...tileProps()} />);
    await expect.element(getTileById(0)).toHaveTextContent("ㄱ");
  });

  it("calls onTap on tap when isTappable", async () => {
    const onTap = vi.fn();
    const screen = await render(<PoolTile {...tileProps({ isTappable: true, onTap })} />);
    await screen.getByRole("button", { name: "ㄱ" }).click();
    expect(onTap).toHaveBeenCalledOnce();
  });

  it("does not call onTap on tap when not isTappable", async () => {
    const onTap = vi.fn();
    const screen = await render(<PoolTile {...tileProps({ isTappable: false, onTap })} />);
    await screen.getByRole("button", { name: "ㄱ" }).click();
    expect(onTap).not.toHaveBeenCalled();
  });

  it("keeps the interactive affordance when not isTappable because pool tiles are draggable", async () => {
    await render(<PoolTile {...tileProps({ isTappable: false })} />);

    await expect.element(getTileById(0)).toHaveAttribute("data-tile-interactive", "true");
  });
});

describe("PoolTile drag", () => {
  it("calls onDropOnSlot with slotIndex and records source snap-back when dropped on a slot", async () => {
    const onDropOnSlot = vi.fn(() => true);
    await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <PoolTile {...tileProps({ onDropOnSlot })} />
        <button data-slot-index="1" data-slot-hitbox>
          _
        </button>
      </div>,
    );
    const tileElement = getTileById(0);
    const slotElement = getSubmissionSlot(1);

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
    await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <PoolTile {...tileProps({ onDropOnTile })} />
        <PoolTile
          tile={targetTile}
          isTappable={false}
          onTap={vi.fn()}
          onDropOnTile={vi.fn(() => true)}
          onDropOnSlot={vi.fn(() => true)}
          getDropTargetFeedback={vi.fn(() => ({ canDrop: true, preview: null }))}
        />
      </div>,
    );

    dragToElementCenter(getTileById(0), getTileById(1));

    await expect.poll(() => onDropOnTile.mock.calls.length).toBe(1);
    expect(onDropOnTile).toHaveBeenCalledWith(1);
  });

  it("calls onDropOnTile for rejected pool tile drops so Pool can handle rejection", async () => {
    const onDropOnTile = vi.fn(() => false);
    const targetTile = tile(1, character({ jungseong: "ㅏ" })!);
    await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <PoolTile
          {...tileProps({
            onDropOnTile,
            getDropTargetFeedback: () => ({ canDrop: false, preview: null }),
          })}
        />
        <PoolTile
          tile={targetTile}
          isTappable={false}
          onTap={vi.fn()}
          onDropOnTile={vi.fn(() => true)}
          onDropOnSlot={vi.fn(() => true)}
          getDropTargetFeedback={vi.fn(() => ({ canDrop: true, preview: null }))}
        />
      </div>,
    );

    dragToElementCenter(getTileById(0), getTileById(1));

    await expect.poll(() => onDropOnTile.mock.calls.length).toBe(1);
    expect(onDropOnTile).toHaveBeenCalledWith(1);
    await expect.element(getTileById(0)).not.toHaveAttribute("data-drop-source-active");
  });

  it("does not call onDropOnSlot or onDropOnTile when dropped on empty space", async () => {
    const onDropOnSlot = vi.fn(() => true);
    const onDropOnTile = vi.fn(() => true);
    await render(<PoolTile {...tileProps({ onDropOnSlot, onDropOnTile })} />);
    const tileElement = getTileById(0);

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
    await render(
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
          getDropTargetFeedback={vi.fn(() => ({ canDrop: true, preview: null }))}
        />
      </div>,
    );
    const tileElement = getTileById(0);
    const targetRect = getTileById(1).getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    dragSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: targetCenterX, clientY: targetCenterY },
    ]);

    await expect.element(getTileById(0)).toHaveAttribute("data-drop-preview", "가");
    await expect.element(getTileById(0)).toHaveTextContent("가");

    dragSequence(tileElement, [
      { type: "pointerup", clientX: targetCenterX, clientY: targetCenterY },
    ]);
    await expect.element(getTileById(0)).not.toHaveAttribute("data-drop-preview");
    await expect.element(getTileById(0)).toHaveTextContent("ㄱ");
  });

  it("highlights empty slot drop target during drag", async () => {
    await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <PoolTile {...tileProps()} />
        <button data-slot-index="0" data-slot-hitbox>
          _
        </button>
      </div>,
    );
    const tileElement = getTileById(0);
    const slotRect = getSubmissionSlot(0).getBoundingClientRect();
    const slotCenterX = slotRect.left + slotRect.width / 2;
    const slotCenterY = slotRect.top + slotRect.height / 2;

    dragSequence(tileElement, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointermove", clientX: slotCenterX, clientY: slotCenterY },
    ]);

    await expect
      .element(getSubmissionSlot(0))
      .toHaveAttribute("data-drop-slot-target-active", "true");

    dragSequence(tileElement, [{ type: "pointerup", clientX: slotCenterX, clientY: slotCenterY }]);
  });
});
