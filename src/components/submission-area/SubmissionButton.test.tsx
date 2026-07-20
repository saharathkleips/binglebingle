import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SubmissionButton } from "./SubmissionButton";

const SUBMIT_BUTTON = { name: "도전" };

describe("SubmissionButton", () => {
  it("is disabled when submission is not ready", async () => {
    const screen = await render(<SubmissionButton isDisabled onSubmit={vi.fn()} />);

    await expect.element(screen.getByRole("button", SUBMIT_BUTTON)).toBeDisabled();
  });

  it("is enabled when submission is ready", async () => {
    const screen = await render(<SubmissionButton isDisabled={false} onSubmit={vi.fn()} />);

    await expect.element(screen.getByRole("button", SUBMIT_BUTTON)).not.toBeDisabled();
  });

  it("calls onSubmit on click when enabled", async () => {
    const handleSubmit = vi.fn();
    const screen = await render(<SubmissionButton isDisabled={false} onSubmit={handleSubmit} />);

    await screen.getByRole("button", SUBMIT_BUTTON).click();

    expect(handleSubmit).toHaveBeenCalledOnce();
  });
});
