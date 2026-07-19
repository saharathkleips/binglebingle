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
import { WinPanel } from "../win-panel/WinPanel";
import type { GameState } from "../../context/game";
import styles from "./App.module.css";

/** Props for the application root. */
type AppProps = {
  /** Optional prebuilt game state, mainly used by tests. */
  initialState?: GameState;
};

// Default puzzle used when no caller supplies initial game state.
const DEV_WORD = createWord("고양이")!;
const DEV_INITIAL_STATE = createInitialGameState(DEV_WORD);

export function App({ initialState = DEV_INITIAL_STATE }: AppProps = {}) {
  return <GameApp initialState={initialState} />;
}

type GameAppProps = {
  /** Initial state passed to the root GameProvider for this mounted game session. */
  initialState: GameState;
};

function GameApp({ initialState }: GameAppProps) {
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
