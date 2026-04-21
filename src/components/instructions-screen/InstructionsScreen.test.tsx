import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { InstructionsScreen } from "./InstructionsScreen";

describe("InstructionsScreen", () => {
  it("renders nothing when isOpen is false", async () => {
    const screen = await render(<InstructionsScreen isOpen={false} onClose={() => {}} />);
    await expect.element(screen.getByTestId("instructions-screen")).not.toBeInTheDocument();
  });

  it("renders the overlay when isOpen is true", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    await expect.element(screen.getByTestId("instructions-screen")).toBeInTheDocument();
  });

  it("renders the rotate step", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    await expect.element(screen.getByText("1. 회전 (Rotate)")).toBeInTheDocument();
  });

  it("renders the combine step", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    await expect.element(screen.getByText("2. 결합 (Combine)")).toBeInTheDocument();
  });

  it("renders the compose step", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    await expect.element(screen.getByText("3. 조합 (Compose)")).toBeInTheDocument();
  });

  it("calls onClose when the dismiss button is clicked", async () => {
    const handleClose = vi.fn();
    const screen = await render(<InstructionsScreen isOpen={true} onClose={handleClose} />);
    await screen.getByTestId("instructions-dismiss").click();
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const handleClose = vi.fn();
    const screen = await render(<InstructionsScreen isOpen={true} onClose={handleClose} />);
    // Click near the top-left corner of the backdrop, outside the centered card
    await screen.getByTestId("instructions-backdrop").click({ position: { x: 1, y: 1 } });
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when the card itself is clicked", async () => {
    const handleClose = vi.fn();
    const screen = await render(<InstructionsScreen isOpen={true} onClose={handleClose} />);
    await screen.getByTestId("instructions-screen").click();
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("has dialog role and aria-modal for accessibility", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const dialog = screen.getByTestId("instructions-screen");
    await expect.element(dialog).toHaveAttribute("role", "dialog");
    await expect.element(dialog).toHaveAttribute("aria-modal", "true");
  });
});
