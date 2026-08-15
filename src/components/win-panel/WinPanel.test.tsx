import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { WinPanel } from "./WinPanel";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";
import { character } from "../../lib/character";
import type { GameState } from "../../context/game";

const WORD = createWord("고양이")!;

function wonState(guessCount: number): GameState {
  const correctGuess = [
    { character: character("고")!, result: "CORRECT" as const },
    { character: character("양")!, result: "CORRECT" as const },
    { character: character("이")!, result: "CORRECT" as const },
  ];
  return {
    ...createInitialGameState(WORD),
    history: Array.from({ length: guessCount }, () => correctGuess),
  };
}

async function renderWinPanel(state: GameState, props: { shareDate?: string | undefined } = {}) {
  return render(
    <GameProvider initialState={state}>
      <WinPanel {...props} />
    </GameProvider>,
  );
}

function mockClipboard() {
  const clipboard = { writeText: vi.fn<Clipboard["writeText"]>().mockResolvedValue(undefined) };
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: clipboard,
  });
  return clipboard;
}

describe("WinPanel", () => {
  it("renders the win panel", async () => {
    const screen = await renderWinPanel(wonState(1));
    await expect.element(screen.getByRole("region", { name: "성공 결과" })).toBeInTheDocument();
  });

  it("does not repeat the target word as text", async () => {
    const screen = await renderWinPanel(wonState(1));
    await expect
      .element(screen.getByRole("button", { name: "정답! 1번째 시도 성공!" }))
      .toBeInTheDocument();
    await expect.element(screen.getByText("고양이")).not.toBeInTheDocument();
  });

  it("displays the guess count when solved in one guess", async () => {
    const screen = await renderWinPanel(wonState(1));
    await expect
      .element(screen.getByRole("button", { name: "정답! 1번째 시도 성공!" }))
      .toBeInTheDocument();
  });

  it("displays the guess count when solved in multiple guesses", async () => {
    const screen = await renderWinPanel(wonState(3));
    await expect
      .element(screen.getByRole("button", { name: "정답! 3번째 시도 성공!" }))
      .toBeInTheDocument();
  });

  it("renders the share button", async () => {
    const screen = await renderWinPanel(wonState(1));
    await expect.element(screen.getByRole("button", { name: "공유" })).not.toBeDisabled();
  });

  it("copies the share summary", async () => {
    const clipboard = mockClipboard();
    const screen = await renderWinPanel(wonState(2), { shareDate: "2026-08-15" });

    await screen.getByRole("button", { name: "공유" }).click();

    expect(clipboard.writeText).toHaveBeenCalledWith("빙글빙글 8/15 · 3칸 · 2회\n🟩🟩🟩\n🟩🟩🟩");
    await expect.element(screen.getByRole("button", { name: "복사됨" })).toBeInTheDocument();
  });
});
