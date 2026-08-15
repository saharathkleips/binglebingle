import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { getRequiredElement } from "../../test-utils/dom-selectors";
import { DATA_TILE_ID_ATTRIBUTE } from "../../lib/dom-data-attributes";
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
    await expect.element(dialog).toHaveTextContent("빙글빙글 하는 법");
    await expect.element(dialog).toHaveTextContent("자모를 돌리고 합쳐");
    await expect.element(dialog).toHaveTextContent("숨은 낱말을 맞혀요");
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

  it("renders the submission section with a slot-filling demo and clue legend", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const section = screen.getByRole("region", { name: "추측 제출" });
    await expect.element(section).toHaveTextContent("칸에 끌어다 놓고 추측해요");
    await expect.element(section).toHaveTextContent("빙");
    await expect.element(section).toHaveTextContent("글");
    await expect.element(section).toHaveTextContent("색으로 단서를 확인해요");
    await expect.element(section).toHaveTextContent("노랑");
    await expect.element(screen.getByLabelText("빈칸")).toBeInTheDocument();
  });

  it("renders tips for submitting guesses", async () => {
    const screen = await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const section = screen.getByRole("region", { name: "팁" });
    await expect.element(section).toHaveTextContent("빈칸이 있어도 제출할 수 있어요");
    await expect.element(section).toHaveTextContent("진짜 낱말이 아니어도 괜찮아요");
    await expect.element(section).toHaveTextContent("몇 번이든 추측할 수 있어요");
    await expect.element(section).toHaveTextContent("정답은 사전 낱말이에요");
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

  it("keeps animated demo tiles out of the tab order", async () => {
    await render(<InstructionsScreen isOpen={true} onClose={() => {}} />);
    const demoButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(`button[${DATA_TILE_ID_ATTRIBUTE}]`),
    );

    expect(demoButtons.length).toBeGreaterThan(0);
    demoButtons.forEach((button) => {
      expect(button.tabIndex).toBe(-1);
      expect(button.getAttribute("aria-hidden")).toBe("true");
    });
  });
});
