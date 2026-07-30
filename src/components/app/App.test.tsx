import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { App } from "./App";
import { GameProvider, useGame } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { character } from "../../lib/character";
import {
  DATA_HISTORY_ANIMATION_SPACER_ATTRIBUTE,
  DATA_SUBMISSION_HISTORY_REVEAL_CARD_ATTRIBUTE,
  dataAttributeSelector,
} from "../../lib/dom-data-attributes";
import { isWon } from "../../lib/engine/scoring";
import { createWord } from "../../lib/word";
import { HistoryArea } from "../history-area/HistoryArea";
import { SubmissionArea } from "../submission-area/SubmissionArea";
import { WinPanel } from "../win-panel/WinPanel";
import type { GameState } from "../../context/game";

const WORD = createWord("고양이")!;
const ONE_SYLLABLE_WORD = createWord("가")!;

function wonState(): GameState {
  return {
    ...createInitialGameState(WORD),
    pool: [],
    submission: [
      { state: "FILLED", tileId: 0, character: character("고")! },
      { state: "FILLED", tileId: 1, character: character("양")! },
      { state: "FILLED", tileId: 2, character: character("이")! },
    ],
    history: [
      [
        { character: character("고")!, result: "CORRECT" as const },
        { character: character("양")!, result: "CORRECT" as const },
        { character: character("이")!, result: "CORRECT" as const },
      ],
    ],
  };
}

function winningSubmissionState(): GameState {
  return {
    ...createInitialGameState(ONE_SYLLABLE_WORD),
    pool: [],
    submission: [{ state: "FILLED", tileId: 0, character: character("가")! }],
  };
}

function SubmitToWinHarness({ initialState }: { initialState: GameState }) {
  return (
    <GameProvider initialState={initialState}>
      <HistoryArea />
      <SubmitToWinContent />
    </GameProvider>
  );
}

function SubmitToWinContent() {
  const { state } = useGame();

  if (isWon(state.history)) {
    return (
      <>
        <SubmissionArea isInteractionDisabled isSubmitVisible={false} isWinDanceEnabled />
        <WinPanel />
      </>
    );
  }

  return <SubmissionArea />;
}

describe("App", () => {
  it("renders the nav bar with the abbreviated game logo", async () => {
    const screen = await render(<App />);
    await expect
      .element(screen.getByRole("navigation", { name: "Primary navigation" }))
      .toBeInTheDocument();
    await expect.element(screen.getByRole("heading", { level: 1 })).toHaveTextContent("ㅂㄱㅂㄱ");
  });

  it("renders pool and submission area", async () => {
    const screen = await render(<App />);
    await expect.element(screen.getByRole("group", { name: "Jamo pool" })).toBeInTheDocument();
    await expect
      .element(screen.getByRole("region", { name: "Submission area" }))
      .toBeInTheDocument();
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
    await expect.element(screen.getByRole("region", { name: "Guess history" })).toBeInTheDocument();
  });
});

describe("App win state", () => {
  it("shows win panel when the game is won", async () => {
    const screen = await render(<App initialState={wonState()} />);
    await expect.element(screen.getByRole("region", { name: "Win summary" })).toBeInTheDocument();
  });

  it("hides pool when the game is won", async () => {
    const screen = await render(<App initialState={wonState()} />);
    await expect.element(screen.getByRole("group", { name: "Jamo pool" })).not.toBeInTheDocument();
  });

  it("keeps a locked submission area when the game is won", async () => {
    const screen = await render(<App initialState={wonState()} />);
    await expect
      .element(screen.getByRole("region", { name: "Submission area" }))
      .toBeInTheDocument();
    await expect.element(screen.getByRole("button", { name: "도전" })).not.toBeInTheDocument();
    await expect.element(screen.getByRole("button", { name: "고" })).not.toBeInTheDocument();
  });

  it("keeps history area visible when the game is won", async () => {
    const screen = await render(<App initialState={wonState()} />);
    await expect.element(screen.getByRole("region", { name: "Guess history" })).toBeInTheDocument();
  });

  it("cleans up submit reveal DOM after transitioning to the win screen", async () => {
    const screen = await render(<SubmitToWinHarness initialState={winningSubmissionState()} />);

    await screen.getByRole("button", { name: "도전" }).click();

    await expect.element(screen.getByRole("region", { name: "Win summary" })).toBeInTheDocument();
    await expect
      .poll(() =>
        document.querySelector(dataAttributeSelector(DATA_HISTORY_ANIMATION_SPACER_ATTRIBUTE)),
      )
      .toBeNull();
    await expect
      .poll(() =>
        document.querySelector(
          dataAttributeSelector(DATA_SUBMISSION_HISTORY_REVEAL_CARD_ATTRIBUTE),
        ),
      )
      .toBeNull();
  });
});
