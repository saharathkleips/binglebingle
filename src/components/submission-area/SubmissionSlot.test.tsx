import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SubmissionSlot } from "./SubmissionSlot";
import { character } from "../../lib/character";
import type { SubmissionSlot as SlotType, GameAction } from "../../context/game";

describe("SubmissionSlot", () => {
  it("renders empty slot with no text", async () => {
    const slot: SlotType = { state: "EMPTY" };
    const screen = await render(<SubmissionSlot slot={slot} slotIndex={0} dispatch={vi.fn()} />);
    await expect.element(screen.getByTestId("slot-0")).toHaveTextContent("");
  });

  it("renders filled slot with resolved character", async () => {
    const slot: SlotType = {
      state: "FILLED",
      tileId: 0,
      character: character({ choseong: "ㄱ" })!,
    };
    const screen = await render(<SubmissionSlot slot={slot} slotIndex={0} dispatch={vi.fn()} />);
    await expect.element(screen.getByTestId("slot-0")).toHaveTextContent("ㄱ");
  });

  it("dispatches SUBMISSION_SLOT_REMOVE on tap when filled", async () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const slot: SlotType = {
      state: "FILLED",
      tileId: 0,
      character: character({ choseong: "ㄱ" })!,
    };
    const screen = await render(<SubmissionSlot slot={slot} slotIndex={1} dispatch={dispatch} />);
    await screen.getByTestId("slot-1").click();
    expect(dispatch).toHaveBeenCalledWith({
      type: "SUBMISSION_SLOT_REMOVE",
      payload: { slotIndex: 1 },
    });
  });

  it("does not dispatch on tap when empty", async () => {
    const dispatch = vi.fn();
    const slot: SlotType = { state: "EMPTY" };
    const screen = await render(<SubmissionSlot slot={slot} slotIndex={0} dispatch={dispatch} />);
    await screen.getByTestId("slot-0").click();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("exposes data-slot-index attribute on the button element", async () => {
    const slot: SlotType = { state: "EMPTY" };
    const screen = await render(<SubmissionSlot slot={slot} slotIndex={2} dispatch={vi.fn()} />);
    await expect.element(screen.getByTestId("slot-2")).toHaveAttribute("data-slot-index", "2");
  });
});
