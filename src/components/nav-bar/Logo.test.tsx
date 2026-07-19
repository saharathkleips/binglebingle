import { afterEach, describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Logo } from "./Logo";

describe("Logo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the abbreviated game logo", async () => {
    const screen = await render(<Logo />);

    await expect.element(screen.getByText("ㅂㄱㅂㄱ")).toBeInTheDocument();
  });

  it("uses the full game title as the logo accessible name", async () => {
    const screen = await render(<Logo />);

    await expect.element(screen.getByRole("heading", { name: "빙글빙글" })).toBeInTheDocument();
  });

  it("randomly rotates the abbreviated logo on click", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const screen = await render(<Logo />);

    await screen.getByRole("button", { name: "빙글빙글" }).click();

    await expect.element(screen.getByText("ㅂㄱㅂㄴ")).toBeInTheDocument();
  });
});
