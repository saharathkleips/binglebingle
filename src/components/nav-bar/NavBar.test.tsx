import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { NavBar } from "./NavBar";

describe("NavBar", () => {
  it("renders the game title", async () => {
    const screen = await render(
      <NavBar onToggleInstructions={() => {}} isInstructionsOpen={false} />,
    );
    await expect.element(screen.getByText("빙글빙글")).toBeInTheDocument();
  });

  it("renders the instructions toggle button", async () => {
    const screen = await render(
      <NavBar onToggleInstructions={() => {}} isInstructionsOpen={false} />,
    );
    await expect.element(screen.getByTestId("instructions-toggle")).toBeInTheDocument();
  });

  it("calls onToggleInstructions when button is clicked", async () => {
    const handleToggle = vi.fn();
    const screen = await render(
      <NavBar onToggleInstructions={handleToggle} isInstructionsOpen={false} />,
    );
    await screen.getByTestId("instructions-toggle").click();
    expect(handleToggle).toHaveBeenCalledOnce();
  });

  it("sets aria-expanded to false when instructions are closed", async () => {
    const screen = await render(
      <NavBar onToggleInstructions={() => {}} isInstructionsOpen={false} />,
    );
    await expect
      .element(screen.getByTestId("instructions-toggle"))
      .toHaveAttribute("aria-expanded", "false");
  });

  it("sets aria-expanded to true when instructions are open", async () => {
    const screen = await render(
      <NavBar onToggleInstructions={() => {}} isInstructionsOpen={true} />,
    );
    await expect
      .element(screen.getByTestId("instructions-toggle"))
      .toHaveAttribute("aria-expanded", "true");
  });
});
