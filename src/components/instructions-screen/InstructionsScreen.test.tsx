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
    await expect.element(screen.getByRole("dialog", { name: "게임 방법" })).not.toBeInTheDocument();
  });

  it("renders the overlay when isOpen is true", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    await expect.element(screen.getByRole("dialog", { name: "게임 방법" })).toBeInTheDocument();
  });

  it("renders the goal text with the initial jamo pool", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog", { name: "게임 방법" });
    await expect.element(dialog).toHaveTextContent("숨은 낱말");
    await expect.element(dialog).toHaveTextContent("ㅇ");
    await expect.element(dialog).toHaveTextContent("ㄱ");
    await expect.element(dialog).toHaveTextContent("ㄹ");
  });

  it("renders the character-building section with the 왜 construction", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const section = screen.getByRole("region", { name: "글자 만들기" });
    await expect.element(section).toHaveTextContent("ㅏ");
    await expect.element(section).toHaveTextContent("ㅜ");
    await expect.element(section).toHaveTextContent("ㅓ");
    await expect.element(section).toHaveTextContent("ㅗ");
    await expect.element(section).toHaveTextContent("ㅘ");
    await expect.element(section).toHaveTextContent("ㅙ");
    await expect.element(section).toHaveTextContent("왜");
  });

  it("renders the submission section with an incomplete guess", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const section = screen.getByRole("region", { name: "추측 제출" });
    await expect.element(section).toHaveTextContent("빈칸도 괜찮아요");
    await expect.element(section).toHaveTextContent("라");
    await expect.element(section).toHaveTextContent("왜");
    await expect.element(section).toHaveTextContent("노랑");
    await expect.element(screen.getByLabelText("빈칸")).toBeInTheDocument();
  });

  it("renders the success section with 왜가리 all correct", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const section = screen.getByRole("region", { name: "성공" });
    await expect.element(section).toHaveTextContent("왜");
    await expect.element(section).toHaveTextContent("가");
    await expect.element(section).toHaveTextContent("리");
  });

  it("calls onClose when the close button is clicked", async () => {
    const handleClose = vi.fn();
    const screen = await render(<InstructionsScreen isOpen={true} onClose={handleClose} />);
    await screen.getByRole("button", { name: "닫기" }).click();
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
    await screen.getByRole("dialog", { name: "게임 방법" }).click();
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("has dialog role and aria-modal for accessibility", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog", { name: "게임 방법" });
    await expect.element(dialog).toHaveAttribute("role", "dialog");
    await expect.element(dialog).toHaveAttribute("aria-modal", "true");
  });
});
