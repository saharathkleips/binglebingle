import { StrictMode } from "react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";

const triggerJamoConfetti = vi.hoisted(() => vi.fn(() => vi.fn()));

vi.mock("../../lib/animation/jamo-confetti", () => ({
  triggerJamoConfetti,
}));

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

async function renderWinPanel(
  state: GameState,
  props: { celebrationScope?: string | undefined; shareDate?: string | undefined } = {},
) {
  return render(
    <GameProvider initialState={state}>
      <WinPanel {...props} />
    </GameProvider>,
  );
}

async function renderWinPanelStrict(
  state: GameState,
  props: { celebrationScope?: string | undefined; shareDate?: string | undefined } = {},
) {
  return render(
    <StrictMode>
      <GameProvider initialState={state}>
        <WinPanel {...props} />
      </GameProvider>
    </StrictMode>,
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
  beforeEach(() => {
    triggerJamoConfetti.mockClear();
    window.localStorage.clear();
  });

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

  it("plays compact confetti after copying the share summary", async () => {
    mockClipboard();
    const screen = await renderWinPanel(wonState(2), { shareDate: "2026-08-15" });

    await screen.getByRole("button", { name: "공유" }).click();

    expect(triggerJamoConfetti).toHaveBeenCalledWith({
      originElement: expect.any(HTMLButtonElement),
      variant: "feedback",
    });
  });

  it("does not repeat the automatic celebration for the same won game", async () => {
    await renderWinPanel(wonState(1), { celebrationScope: "same-game" });
    await expect.poll(() => triggerJamoConfetti).toHaveBeenCalledTimes(1);

    await renderWinPanel(wonState(1), { celebrationScope: "same-game" });

    expect(triggerJamoConfetti).toHaveBeenCalledTimes(1);
  });

  it("plays the automatic celebration for a newly won game on another difficulty", async () => {
    await renderWinPanel(wonState(1), { celebrationScope: "2026-08-15:3" });
    await expect.poll(() => triggerJamoConfetti).toHaveBeenCalledTimes(1);

    await renderWinPanel(wonState(1), { celebrationScope: "2026-08-15:4" });

    await expect.poll(() => triggerJamoConfetti).toHaveBeenCalledTimes(2);
  });

  it("plays the automatic celebration inside React StrictMode", async () => {
    await renderWinPanelStrict(wonState(1), { celebrationScope: "strict-mode-game" });

    await expect.poll(() => triggerJamoConfetti).toHaveBeenCalledTimes(1);
  });
});
