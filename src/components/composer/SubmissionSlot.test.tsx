import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubmissionSlot } from "./SubmissionSlot";
import { character } from "../../lib/character";
import type { SubmissionSlot as SlotType, GameAction } from "../../context/game";

describe("SubmissionSlot", () => {
  it("renders empty slot with no text", () => {
    const slot: SlotType = { state: "EMPTY" };
    render(<SubmissionSlot slot={slot} slotIndex={0} dispatch={vi.fn()} />);
    expect(screen.getByTestId("slot-0").textContent).toBe("");
  });

  it("renders filled slot with resolved character", () => {
    const slot: SlotType = {
      state: "FILLED",
      tileId: 0,
      character: character({ choseong: "ㄱ" })!,
    };
    render(<SubmissionSlot slot={slot} slotIndex={0} dispatch={vi.fn()} />);
    expect(screen.getByTestId("slot-0").textContent).toBe("ㄱ");
  });

  it("dispatches SUBMISSION_SLOT_REMOVE on tap when filled", () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const slot: SlotType = {
      state: "FILLED",
      tileId: 0,
      character: character({ choseong: "ㄱ" })!,
    };
    render(<SubmissionSlot slot={slot} slotIndex={1} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId("slot-1"));
    expect(dispatch).toHaveBeenCalledWith({
      type: "SUBMISSION_SLOT_REMOVE",
      payload: { slotIndex: 1 },
    });
  });

  it("does not dispatch on tap when empty", () => {
    const dispatch = vi.fn();
    const slot: SlotType = { state: "EMPTY" };
    render(<SubmissionSlot slot={slot} slotIndex={0} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId("slot-0"));
    expect(dispatch).not.toHaveBeenCalled();
  });
});
