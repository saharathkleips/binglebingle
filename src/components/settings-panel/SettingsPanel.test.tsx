import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SettingsPanel } from "./SettingsPanel";

describe("SettingsPanel", () => {
  it("does not render when closed", async () => {
    const screen = await render(
      <SettingsPanel isOpen={false} onClose={() => {}} onClearLocalStorage={() => {}} />,
    );
    await expect.element(screen.getByRole("dialog", { name: "설정" })).not.toBeInTheDocument();
  });

  it("renders the local storage clear button when open", async () => {
    const screen = await render(
      <SettingsPanel isOpen onClose={() => {}} onClearLocalStorage={() => {}} />,
    );
    await expect.element(screen.getByRole("dialog", { name: "설정" })).toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "로컬 저장 삭제" }))
      .toBeInTheDocument();
  });

  it("calls onClearLocalStorage when the clear button is clicked", async () => {
    const handleClearLocalStorage = vi.fn();
    const screen = await render(
      <SettingsPanel isOpen onClose={() => {}} onClearLocalStorage={handleClearLocalStorage} />,
    );
    await screen.getByRole("button", { name: "로컬 저장 삭제" }).click();
    expect(handleClearLocalStorage).toHaveBeenCalledOnce();
  });
});
