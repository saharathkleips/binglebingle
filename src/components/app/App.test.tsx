import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { App } from "./App";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";
import { character } from "../../lib/character";

const WORD = createWord("고양이")!;

describe("App", () => {
  it("renders the nav bar with the game title", async () => {
    const screen = await render(<App />);
    await expect.element(screen.getByTestId("nav-bar")).toBeInTheDocument();
    await expect.element(screen.getByText("빙글빙글")).toBeInTheDocument();
  });

  it("renders pool and submission area", async () => {
    const screen = await render(<App />);
    await expect.element(screen.getByTestId("pool")).toBeInTheDocument();
    await expect.element(screen.getByTestId("submission-area")).toBeInTheDocument();
  });

  it("renders history area when initial state has a prior guess", async () => {
    const initialState = {
      ...createInitialGameState(WORD),
      history: [
        [
          { character: character({ choseong: "ㄱ", jungseong: "ㅗ" })!, result: "ABSENT" as const },
          {
            character: character({ choseong: "ㅇ", jungseong: "ㅏ", jongseong: "ㅇ" })!,
            result: "ABSENT" as const,
          },
          { character: character({ choseong: "ㅇ", jungseong: "ㅣ" })!, result: "ABSENT" as const },
        ],
      ],
    };
    const screen = await render(<App initialState={initialState} />);
    await expect.element(screen.getByTestId("history-area")).toBeInTheDocument();
  });
});
