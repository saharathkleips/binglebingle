import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { BaseTile } from "./BaseTile";

describe("BaseTile", () => {
  it("renders children in a div when no element is provided", async () => {
    const screen = await render(<BaseTile>ㄱ</BaseTile>);

    await expect.element(screen.getByText("ㄱ")).toBeInTheDocument();
  });

  it("renders a button when element is button", async () => {
    const screen = await render(<BaseTile element="button">ㅏ</BaseTile>);

    await expect.element(screen.getByRole("button", { name: "ㅏ" })).toBeInTheDocument();
  });

  it("uses label as the accessible name", async () => {
    const screen = await render(
      <BaseTile element="span" label="기역 타일">
        ㄱ
      </BaseTile>,
    );

    await expect.element(screen.getByLabelText("기역 타일")).toHaveTextContent("ㄱ");
  });
});
