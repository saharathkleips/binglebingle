import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { getRequiredElement } from "../../test-utils/dom-selectors";
import { InstructionsScreen } from "./InstructionsScreen";

function instructionsBackdrop(): HTMLElement {
  return getRequiredElement("[data-instructions-backdrop]");
}

describe("InstructionsScreen", () => {
  it("renders nothing when isOpen is false", async () => {
    const screen = await render(<InstructionsScreen isOpen={false} onClose={() => {}} />);
    await expect
      .element(screen.getByRole("dialog", { name: "Game instructions" }))
      .not.toBeInTheDocument();
  });

  it("renders the overlay when isOpen is true", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    await expect
      .element(screen.getByRole("dialog", { name: "Game instructions" }))
      .toBeInTheDocument();
  });

  it("renders the compose phase with the jamo pool", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    await expect.element(screen.getByRole("region", { name: "Compose phase" })).toBeInTheDocument();
  });

  it("renders the compose phase with 가 as present", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const phase = screen.getByRole("region", { name: "Compose phase" });
    await expect.element(phase).toHaveTextContent("가");
  });

  it("renders the rotate phase with 오가로", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const phase = screen.getByRole("region", { name: "Rotate phase" });
    await expect.element(phase).toHaveTextContent("오");
    await expect.element(phase).toHaveTextContent("가");
    await expect.element(phase).toHaveTextContent("로");
  });

  it("renders the deconstruct phase with 왜가리 all correct", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const phase = screen.getByRole("region", { name: "Deconstruct phase" });
    await expect.element(phase).toHaveTextContent("왜");
    await expect.element(phase).toHaveTextContent("가");
    await expect.element(phase).toHaveTextContent("리");
  });

  it("calls onClose when the dismiss button is clicked", async () => {
    const handleClose = vi.fn();
    const screen = await render(<InstructionsScreen isOpen={true} onClose={handleClose} />);
    await screen.getByRole("button", { name: "알겠어요!" }).click();
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const handleClose = vi.fn();
    await render(<InstructionsScreen isOpen={true} onClose={handleClose} />);
    instructionsBackdrop().click();
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when the card itself is clicked", async () => {
    const handleClose = vi.fn();
    const screen = await render(<InstructionsScreen isOpen={true} onClose={handleClose} />);
    await screen.getByRole("dialog", { name: "Game instructions" }).click();
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("has dialog role and aria-modal for accessibility", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog", { name: "Game instructions" });
    await expect.element(dialog).toHaveAttribute("role", "dialog");
    await expect.element(dialog).toHaveAttribute("aria-modal", "true");
  });
});
