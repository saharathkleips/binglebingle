import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { App } from "./App";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";
import { character } from "../../lib/character";
import type { GameState } from "../../context/game";

const WORD = createWord("고양이")!;

function wonState(): GameState {
  return {
    ...createInitialGameState(WORD),
    history: [
      [
        { character: character("고")!, result: "CORRECT" as const },
        { character: character("양")!, result: "CORRECT" as const },
        { character: character("이")!, result: "CORRECT" as const },
      ],
    ],
  };
}

describe("App", () => {
  it("renders the nav bar with the game title", async () => {
    const screen = await render(<App />);
    await expect.element(screen.getByTestId("nav-bar")).toBeInTheDocument();
    await expect.element(screen.getByRole("heading", { level: 1 })).toHaveTextContent("빙글빙글");
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

describe("App win state", () => {
  it("shows win panel when the game is won", async () => {
    const screen = await render(<App initialState={wonState()} />);
    await expect.element(screen.getByTestId("win-panel")).toBeInTheDocument();
  });

  it("hides pool when the game is won", async () => {
    const screen = await render(<App initialState={wonState()} />);
    await expect.element(screen.getByTestId("pool")).not.toBeInTheDocument();
  });

  it("hides submission area when the game is won", async () => {
    const screen = await render(<App initialState={wonState()} />);
    await expect.element(screen.getByTestId("submission-area")).not.toBeInTheDocument();
  });

  it("keeps history area visible when the game is won", async () => {
    const screen = await render(<App initialState={wonState()} />);
    await expect.element(screen.getByTestId("history-area")).toBeInTheDocument();
  });
});
