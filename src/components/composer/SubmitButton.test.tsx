import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubmitButton } from "./SubmitButton";
import { character } from "../../lib/character";
import type { SubmissionSlot, GameAction } from "../../context/game";

describe("SubmitButton", () => {
  it("is disabled when submission is empty", () => {
    const submission: SubmissionSlot[] = [{ state: "EMPTY" }];
    render(<SubmitButton submission={submission} dispatch={vi.fn()} />);
    expect((screen.getByTestId("submit-button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("is disabled when a filled slot has an incomplete character", () => {
    const submission: SubmissionSlot[] = [
      { state: "FILLED", tileId: 0, character: character({ choseong: "ㄱ" })! },
    ];
    render(<SubmitButton submission={submission} dispatch={vi.fn()} />);
    expect((screen.getByTestId("submit-button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("is enabled when all filled slots have complete characters", () => {
    const submission: SubmissionSlot[] = [
      { state: "FILLED", tileId: 0, character: character("가")! },
    ];
    render(<SubmitButton submission={submission} dispatch={vi.fn()} />);
    expect((screen.getByTestId("submit-button") as HTMLButtonElement).disabled).toBe(false);
  });

  it("dispatches ROUND_SUBMISSION_SUBMIT on click when valid", () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const submission: SubmissionSlot[] = [
      { state: "FILLED", tileId: 0, character: character("가")! },
    ];
    render(<SubmitButton submission={submission} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId("submit-button"));
    expect(dispatch).toHaveBeenCalledWith({ type: "ROUND_SUBMISSION_SUBMIT" });
  });
});
