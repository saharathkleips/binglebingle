import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { BoardTile } from "./BoardTile";
import { character } from "../../lib/character";
import type { EvaluatedCharacter } from "../../lib/engine";

describe("BoardTile", () => {
  it("displays the resolved character", async () => {
    const evaluated: EvaluatedCharacter = {
      character: character("가")!,
      result: "CORRECT",
    };
    const screen = await render(<BoardTile evaluated={evaluated} />);
    await expect.element(screen.getByTestId("board-tile")).toHaveTextContent("가");
  });

  it("displays empty string when character is absent", async () => {
    const evaluated: EvaluatedCharacter = { result: "ABSENT" };
    const screen = await render(<BoardTile evaluated={evaluated} />);
    await expect.element(screen.getByTestId("board-tile")).toHaveTextContent("");
  });

  it.each(["CORRECT", "PRESENT", "ABSENT"] as const)("sets data-result to %s", async (result) => {
    const evaluated: EvaluatedCharacter = {
      character: character("가")!,
      result,
    };
    const screen = await render(<BoardTile evaluated={evaluated} />);
    await expect.element(screen.getByTestId("board-tile")).toHaveAttribute("data-result", result);
  });
});
