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

// Temporary dev wiring — replaced by Game.tsx in milestone 1.3.1
const DEV_WORD = createWord("고양이")!;
const DEV_INITIAL_STATE = createInitialGameState(DEV_WORD);

export function App({ initialState = DEV_INITIAL_STATE }: { initialState?: GameState } = {}) {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);

  function handleToggleInstructions() {
    setIsInstructionsOpen((isOpen) => !isOpen);
  }

  return (
    <GameProvider initialState={initialState}>
      <div className={styles.app}>
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
