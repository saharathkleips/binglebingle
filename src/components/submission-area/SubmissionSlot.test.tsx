import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SubmissionSlot } from "./SubmissionSlot";
import { character } from "../../lib/character";
import type { SubmissionSlot as SlotType } from "../../context/game";

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

    // pointerdown then move > DRAG_THRESHOLD_PX (4px) to start drag, then release on slot-1
    pointerSequence(button0, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointerup", clientX: targetX, clientY: targetY },
    ]);

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
    pointerSequence(button, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointercancel", clientX: 10, clientY: 0 },
    ]);

    expect(onDropOnSlot).not.toHaveBeenCalled();
  });

  it("suppresses the click that follows a completed drag gesture", async () => {
    const onTap = vi.fn();
    const screen = await render(
      <SubmissionSlot slot={FILLED_SLOT} slotIndex={0} onTap={onTap} onDropOnSlot={vi.fn()} />,
    );

    const button = screen.getByTestId("slot-0").element();
    pointerSequence(button, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 10, clientY: 0 },
      { type: "pointerup", clientX: 10, clientY: 0 },
    ]);

    // Synthetic click event immediately following a drag must be ignored
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(onTap).not.toHaveBeenCalled();
  });

  it("ignores pointermove when no pointerdown has been recorded", async () => {
    const onDropOnSlot = vi.fn();
    const screen = await render(
      <SubmissionSlot
        slot={FILLED_SLOT}
        slotIndex={0}
        onTap={vi.fn()}
        onDropOnSlot={onDropOnSlot}
      />,
    );

    screen
      .getByTestId("slot-0")
      .element()
      .dispatchEvent(
        new PointerEvent("pointermove", { clientX: 100, clientY: 100, bubbles: true }),
      );

    expect(onDropOnSlot).not.toHaveBeenCalled();
  });

  it("does not start drag when movement is below the threshold", async () => {
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
    // Move only 2px — below DRAG_THRESHOLD_PX of 4
    pointerSequence(button, [
      { type: "pointerdown", clientX: 0, clientY: 0 },
      { type: "pointermove", clientX: 2, clientY: 0 },
      { type: "pointerup", clientX: 2, clientY: 0 },
    ]);

    // pointerup without a drag in progress returns early; no drop call
    expect(onDropOnSlot).not.toHaveBeenCalled();
  });
});
