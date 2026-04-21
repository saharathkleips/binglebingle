import { useState } from "react";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";
import { Pool } from "../pool/Pool";
import { SubmissionArea } from "../submission-area/SubmissionArea";
import { HistoryArea } from "../history-area/HistoryArea";
import { NavBar } from "../nav-bar/NavBar";
import { InstructionsScreen } from "../instructions-screen/InstructionsScreen";
import type { GameState } from "../../context/game";

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
      <NavBar
        onToggleInstructions={handleToggleInstructions}
        isInstructionsOpen={isInstructionsOpen}
      />
      <InstructionsScreen isOpen={isInstructionsOpen} onClose={handleToggleInstructions} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          padding: "2rem",
        }}
      >
        <HistoryArea />
        <SubmissionArea />
        <Pool />
      </div>
    </GameProvider>
  );
}
