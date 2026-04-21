import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SubmissionSlot } from "./SubmissionSlot";
import { character } from "../../lib/character";
import type { SubmissionSlot as SlotType } from "../../context/game";

describe("SubmissionSlot", () => {
  it("renders empty slot with no text", async () => {
    const slot: SlotType = { state: "EMPTY" };
    const screen = await render(
      <SubmissionSlot slot={slot} slotIndex={0} onTap={vi.fn()} onDropOnSlot={vi.fn()} />,
    );
    await expect.element(screen.getByTestId("slot-0")).toHaveTextContent("");
  });

  it("renders filled slot with resolved character", async () => {
    const slot: SlotType = {
      state: "FILLED",
      tileId: 0,
      character: character({ choseong: "ㄱ" })!,
    };
    const screen = await render(
      <SubmissionSlot slot={slot} slotIndex={0} onTap={vi.fn()} onDropOnSlot={vi.fn()} />,
    );
    await expect.element(screen.getByTestId("slot-0")).toHaveTextContent("ㄱ");
  });

  it("calls onTap when tapped and filled", async () => {
    const onTap = vi.fn();
    const slot: SlotType = {
      state: "FILLED",
      tileId: 0,
      character: character({ choseong: "ㄱ" })!,
    };
    const screen = await render(
      <SubmissionSlot slot={slot} slotIndex={1} onTap={onTap} onDropOnSlot={vi.fn()} />,
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
