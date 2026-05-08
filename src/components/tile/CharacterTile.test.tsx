import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { CharacterTile } from "./CharacterTile";
import type { Character } from "../../lib/character";

describe("CharacterTile", () => {
  it("renders the resolved jamo when the character is a single slot", async () => {
    const singleJamoCharacter: Character = { kind: "CHOSEONG_ONLY", choseong: "ㄱ" };

    const screen = await render(<CharacterTile character={singleJamoCharacter} />);

    await expect.element(screen.getByText("ㄱ")).toBeInTheDocument();
  });

  it("renders the resolved syllable when the character is complete", async () => {
    const completeCharacter: Character = {
      kind: "OPEN_SYLLABLE",
      choseong: "ㄱ",
      jungseong: "ㅏ",
    };

    const screen = await render(<CharacterTile character={completeCharacter} />);

    await expect.element(screen.getByText("가")).toBeInTheDocument();
  });

  it("renders an empty tile when the character is empty", async () => {
    const emptyCharacter: Character = { kind: "EMPTY" };

    const screen = await render(<CharacterTile character={emptyCharacter} label="빈 타일" />);

    await expect.element(screen.getByLabelText("빈 타일")).toHaveTextContent("");
  });
});
