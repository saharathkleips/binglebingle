import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";
import { Pool } from "../pool/Pool";
import { SubmissionArea } from "../submission-area/SubmissionArea";
import { HistoryArea } from "../history-area/HistoryArea";

// Temporary dev wiring — replaced by Game.tsx in milestone 1.3.1
const DEV_WORD = createWord("고양이")!;
const DEV_INITIAL_STATE = createInitialGameState(DEV_WORD);

export function App() {
  return (
    <GameProvider initialState={DEV_INITIAL_STATE}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>빙글빙글</h1>
        <HistoryArea />
        <SubmissionArea />
        <Pool />
      </div>
    </GameProvider>
  );
}
