import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { getRequiredElement } from "../../test-utils/dom-selectors";
import { HistoryCard } from "./HistoryCard";
import { character } from "../../lib/character";
import {
  DATA_HISTORY_CARD_ATTRIBUTE,
  DATA_HISTORY_EMPTY_CARD_ATTRIBUTE,
  DATA_LOTUS_TILE_BACK_ATTRIBUTE,
  DATA_RESULT_ATTRIBUTE,
} from "../../lib/dom-data-attributes";
import type { EvaluatedCharacter } from "../../lib/engine";

describe("HistoryCard", () => {
  it("displays the resolved character", async () => {
    const evaluated: EvaluatedCharacter = {
      character: character("가")!,
      result: "CORRECT",
    };
    await render(<HistoryCard evaluated={evaluated} />);
    await expect
      .element(getRequiredElement(`[${DATA_HISTORY_CARD_ATTRIBUTE}]`))
      .toHaveTextContent("가");
  });

  it("displays an empty lotus tile back when character is absent", async () => {
    const evaluated: EvaluatedCharacter = { result: "ABSENT" };
    await render(<HistoryCard evaluated={evaluated} />);
    await expect
      .element(getRequiredElement(`[${DATA_HISTORY_CARD_ATTRIBUTE}]`))
      .toHaveTextContent("");
    const historyCard = getRequiredElement(`[${DATA_HISTORY_CARD_ATTRIBUTE}]`);
    await expect.element(historyCard).toHaveAttribute(DATA_HISTORY_EMPTY_CARD_ATTRIBUTE, "true");
    await expect.element(historyCard).not.toHaveAttribute(DATA_RESULT_ATTRIBUTE);
    await expect
      .element(getRequiredElement(`[${DATA_LOTUS_TILE_BACK_ATTRIBUTE}]`))
      .toBeInTheDocument();
  });

  it.each(["CORRECT", "PRESENT", "ABSENT"] as const)("sets data-result to %s", async (result) => {
    const evaluated: EvaluatedCharacter = {
      character: character("가")!,
      result,
    };
    await render(<HistoryCard evaluated={evaluated} />);
    await expect
      .element(getRequiredElement(`[${DATA_HISTORY_CARD_ATTRIBUTE}]`))
      .toHaveAttribute(DATA_RESULT_ATTRIBUTE, result);
  });
});
