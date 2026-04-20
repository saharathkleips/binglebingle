import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SubmissionButton } from "./SubmissionButton";
import { character } from "../../lib/character";
import type { SubmissionSlot, GameAction } from "../../context/game";

describe("SubmissionButton", () => {
  it("is disabled when submission is empty", async () => {
    const submission: SubmissionSlot[] = [{ state: "EMPTY" }];
    const screen = await render(<SubmissionButton submission={submission} dispatch={vi.fn()} />);
    await expect.element(screen.getByTestId("submission-button")).toBeDisabled();
  });

  it("is disabled when a filled slot has an incomplete character", async () => {
    const submission: SubmissionSlot[] = [
      { state: "FILLED", tileId: 0, character: character({ choseong: "ㄱ" })! },
    ];
    const screen = await render(<SubmissionButton submission={submission} dispatch={vi.fn()} />);
    await expect.element(screen.getByTestId("submission-button")).toBeDisabled();
  });

  it("is enabled when all filled slots have complete characters", async () => {
    const submission: SubmissionSlot[] = [
      { state: "FILLED", tileId: 0, character: character("가")! },
    ];
    const screen = await render(<SubmissionButton submission={submission} dispatch={vi.fn()} />);
    await expect.element(screen.getByTestId("submission-button")).not.toBeDisabled();
  });

  it("dispatches ROUND_SUBMISSION_SUBMIT on click when valid", async () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const submission: SubmissionSlot[] = [
      { state: "FILLED", tileId: 0, character: character("가")! },
    ];
    const screen = await render(<SubmissionButton submission={submission} dispatch={dispatch} />);
    await screen.getByTestId("submission-button").click();
    expect(dispatch).toHaveBeenCalledWith({ type: "ROUND_SUBMISSION_SUBMIT" });
  });
});
