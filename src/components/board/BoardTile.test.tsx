import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardTile } from "./BoardTile";
import { character } from "../../lib/character";
import type { EvaluatedCharacter } from "../../lib/engine";

describe("BoardTile", () => {
  it("displays the resolved character", () => {
    const evaluated: EvaluatedCharacter = {
      character: character("가")!,
      result: "CORRECT",
    };
    render(<BoardTile evaluated={evaluated} />);
    expect(screen.getByTestId("board-tile").textContent).toBe("가");
  });

  it("displays empty string when character is absent", () => {
    const evaluated: EvaluatedCharacter = { result: "ABSENT" };
    render(<BoardTile evaluated={evaluated} />);
    expect(screen.getByTestId("board-tile").textContent).toBe("");
  });

  it.each(["CORRECT", "PRESENT", "ABSENT"] as const)("sets data-result to %s", (result) => {
    const evaluated: EvaluatedCharacter = {
      character: character("가")!,
      result,
    };
    render(<BoardTile evaluated={evaluated} />);
    expect(screen.getByTestId("board-tile").getAttribute("data-result")).toBe(result);
  });
});
