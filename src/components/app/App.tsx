import { useState } from "react";
import { GameProvider } from "../../context/game/GameContext";
import { useGame } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";
import { isWon } from "../../lib/engine/scoring";
import { Pool } from "../pool/Pool";
import { SubmissionArea } from "../submission-area/SubmissionArea";
import { HistoryArea } from "../history-area/HistoryArea";
import { NavBar } from "../nav-bar/NavBar";
import { InstructionsScreen } from "../instructions-screen/InstructionsScreen";
import { TilePreview } from "./TilePreview";
import { WinPanel } from "../win-panel/WinPanel";
import type { GameState } from "../../context/game";
import styles from "./App.module.css";

// Temporary dev wiring — replaced by Game.tsx in milestone 1.3.1
const DEV_WORD = createWord("고양이")!;
const DEV_INITIAL_STATE = createInitialGameState(DEV_WORD);

const TILE_PREVIEW_QUERY_KEY = "tilePreview";

const TILE_PREVIEW_BREAKPOINTS = [
  { name: "z-fold-5", width: 344, height: 882 },
  { name: "galaxy-s8+", width: 360, height: 740 },
  { name: "x-small", width: 375, height: 667 },
  { name: "small", width: 390, height: 700 },
  { name: "medium", width: 480, height: 760 },
  { name: "nest-hub", width: 1024, height: 600 },
  { name: "large", width: 768, height: 760 },
  { name: "x-large", width: 1100, height: 800 },
] as const;

export function App({ initialState = DEV_INITIAL_STATE }: { initialState?: GameState } = {}) {
  const tilePreviewMode = getTilePreviewMode();

  if (tilePreviewMode === "frame") {
    return <TilePreviewFrame />;
  }

  if (tilePreviewMode === "screen") {
    return <TilePreviewScreen />;
  }

  return <GameApp initialState={initialState} />;
}

function GameApp({ initialState }: { initialState: GameState }) {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);

  function handleToggleInstructions() {
    setIsInstructionsOpen((isOpen) => !isOpen);
  }

  return (
    <GameProvider initialState={initialState}>
      <div className={styles.app}>
        <div className={styles.gameShell}>
          <NavBar
            onToggleInstructions={handleToggleInstructions}
            isInstructionsOpen={isInstructionsOpen}
          />
          <InstructionsScreen isOpen={isInstructionsOpen} onClose={handleToggleInstructions} />
          <div className={styles.gameArea}>
            <HistoryArea />
            <div className={styles.gameContent}>
              <GameContent />
            </div>
          </div>
        </div>
      </div>
    </GameProvider>
  );
}

function GameContent() {
  const { state } = useGame();

  if (isWon(state.history)) {
    return <WinPanel />;
  }

  return (
    <>
      <SubmissionArea />
      <Pool />
    </>
  );
}

function TilePreviewScreen() {
  const [selectedBreakpointName, setSelectedBreakpointName] = useState<string>(
    TILE_PREVIEW_BREAKPOINTS[0].name,
  );
  const selectedBreakpoint =
    TILE_PREVIEW_BREAKPOINTS.find((breakpoint) => breakpoint.name === selectedBreakpointName) ??
    TILE_PREVIEW_BREAKPOINTS[0];

  return (
    <main className={styles.tilePreviewScreen} data-testid="tile-preview-screen">
      <section className={styles.tilePreviewControls} aria-label="Tile preview controls">
        <div>
          <h1 className={styles.tilePreviewTitle}>타일 미리보기</h1>
          <p className={styles.tilePreviewHelp}>
            버튼은 브라우저 크기 대신 iframe 뷰포트를 바꿔서 CSS breakpoint를 확인합니다.
          </p>
        </div>
        <div className={styles.tilePreviewButtons}>
          {TILE_PREVIEW_BREAKPOINTS.map((breakpoint) => (
            <button
              className={styles.tilePreviewButton}
              type="button"
              aria-pressed={breakpoint.name === selectedBreakpoint.name}
              key={breakpoint.name}
              onClick={() => setSelectedBreakpointName(breakpoint.name)}
            >
              {breakpoint.name}
              <span className={styles.tilePreviewButtonSize}>
                {breakpoint.width}×{breakpoint.height}
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className={styles.tilePreviewStage} aria-label="Selected tile breakpoint preview">
        <iframe
          className={styles.tilePreviewFrame}
          title={`${selectedBreakpoint.name} tile preview`}
          src={getTilePreviewFrameSource()}
          width={selectedBreakpoint.width}
          height={selectedBreakpoint.height}
        />
      </section>
    </main>
  );
}

function TilePreviewFrame() {
  return <TilePreview />;
}

function getTilePreviewMode() {
  const searchParams = new URLSearchParams(window.location.search);
  const tilePreviewMode = searchParams.get(TILE_PREVIEW_QUERY_KEY);

  if (tilePreviewMode === "1") return "screen";
  if (tilePreviewMode === "frame") return "frame";
  return "off";
}

function getTilePreviewFrameSource() {
  const url = new URL(window.location.href);
  url.searchParams.set(TILE_PREVIEW_QUERY_KEY, "frame");
  return `${url.pathname}${url.search}${url.hash}`;
}
