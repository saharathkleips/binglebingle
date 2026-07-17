import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { getRequiredElement } from "../../test-utils/dom-selectors";
import { HistoryTile } from "./HistoryTile";
import { character } from "../../lib/character";
import type { EvaluatedCharacter } from "../../lib/engine";

describe("HistoryTile", () => {
  it("displays the resolved character", async () => {
    const evaluated: EvaluatedCharacter = {
      character: character("가")!,
      result: "CORRECT",
    };
    await render(<HistoryTile evaluated={evaluated} />);
    await expect.element(getRequiredElement("[data-history-tile]")).toHaveTextContent("가");
  });

  it("displays empty string when character is absent", async () => {
    const evaluated: EvaluatedCharacter = { result: "ABSENT" };
    await render(<HistoryTile evaluated={evaluated} />);
    await expect.element(getRequiredElement("[data-history-tile]")).toHaveTextContent("");
  });

  it.each(["CORRECT", "PRESENT", "ABSENT"] as const)("sets data-result to %s", async (result) => {
    const evaluated: EvaluatedCharacter = {
      character: character("가")!,
      result,
    };
    await render(<HistoryTile evaluated={evaluated} />);
    await expect
      .element(getRequiredElement("[data-history-tile]"))
      .toHaveAttribute("data-result", result);
  });
});
