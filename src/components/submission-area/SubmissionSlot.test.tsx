import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SubmissionSlot } from "./SubmissionSlot";
import { character } from "../../lib/character";
import type { SubmissionSlot as SlotType } from "../../context/game";

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

const FILLED_SLOT: SlotType = {
  state: "FILLED",
  tileId: 0,
  character: character({ choseong: "ㄱ" })!,
};

const FILLED_SLOT_1: SlotType = {
  state: "FILLED",
  tileId: 1,
  character: character({ choseong: "ㄴ" })!,
};

describe("SubmissionSlot", () => {
  it("renders empty slot with no text", async () => {
    const slot: SlotType = { state: "EMPTY" };
    const screen = await render(
      <SubmissionSlot slot={slot} slotIndex={0} onTap={vi.fn()} onDropOnSlot={vi.fn()} />,
    );
    await expect.element(screen.getByTestId("slot-0")).toHaveTextContent("");
  });

  it("renders filled slot with resolved character", async () => {
    const screen = await render(
      <SubmissionSlot slot={FILLED_SLOT} slotIndex={0} onTap={vi.fn()} onDropOnSlot={vi.fn()} />,
    );
    await expect.element(screen.getByTestId("slot-0")).toHaveTextContent("ㄱ");
  });

  it("calls onTap when tapped and filled", async () => {
    const onTap = vi.fn();
    const screen = await render(
      <SubmissionSlot slot={FILLED_SLOT} slotIndex={1} onTap={onTap} onDropOnSlot={vi.fn()} />,
    );
    await screen.getByTestId("slot-1").click();
    expect(onTap).toHaveBeenCalled();
  });

  it("does not call onTap when tapped and empty", async () => {
    const onTap = vi.fn();
    const slot: SlotType = { state: "EMPTY" };
    const screen = await render(
      <SubmissionSlot slot={slot} slotIndex={0} onTap={onTap} onDropOnSlot={vi.fn()} />,
    );
    await screen.getByTestId("slot-0").click();
    expect(onTap).not.toHaveBeenCalled();
  });

  it("exposes data-slot-index attribute on the button element", async () => {
    const slot: SlotType = { state: "EMPTY" };
    const screen = await render(
      <SubmissionSlot slot={slot} slotIndex={2} onTap={vi.fn()} onDropOnSlot={vi.fn()} />,
    );
    await expect.element(screen.getByTestId("slot-2")).toHaveAttribute("data-slot-index", "2");
  });
});

describe("SubmissionSlot drag", () => {
  it("calls onDropOnSlot with target index after drag-and-drop onto another slot", async () => {
    const onDropOnSlot0 = vi.fn();
    const screen = await render(
      <div style={{ display: "flex", gap: "100px" }}>
        <SubmissionSlot
          slot={FILLED_SLOT}
          slotIndex={0}
          onTap={vi.fn()}
          onDropOnSlot={onDropOnSlot0}
        />
        <SubmissionSlot slot={FILLED_SLOT_1} slotIndex={1} onTap={vi.fn()} onDropOnSlot={vi.fn()} />
      </div>,
    );

    const button0 = screen.getByTestId("slot-0").element();
    const button1 = screen.getByTestId("slot-1").element();
    const rect1 = button1.getBoundingClientRect();
    const targetX = rect1.left + rect1.width / 2;
    const targetY = rect1.top + rect1.height / 2;

    dragSequence(button0, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointerup", clientX: targetX, clientY: targetY },
    ]);

    await expect.poll(() => onDropOnSlot0.mock.calls.length).toBe(1);
    expect(onDropOnSlot0).toHaveBeenCalledWith(1);
  });

  it("does not call onDropOnSlot when pointer is cancelled during drag", async () => {
    const onDropOnSlot = vi.fn();
    const screen = await render(
      <SubmissionSlot
        slot={FILLED_SLOT}
        slotIndex={0}
        onTap={vi.fn()}
        onDropOnSlot={onDropOnSlot}
      />,
    );

    const button = screen.getByTestId("slot-0").element();
    dragSequence(button, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointercancel", clientX: 10, clientY: 0 },
    ]);

    expect(onDropOnSlot).not.toHaveBeenCalled();
  });
});
