import { useEffect, useState, type ReactNode } from "react";
import { GameProvider } from "../../context/game/GameContext";
import { useGame } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { isWon } from "../../lib/engine/scoring";
import { createWord } from "../../lib/word";
import {
  DIFFICULTIES,
  isSupportedDifficulty,
  loadDailyWords,
  selectDailyWord,
  todayIso,
  type Difficulty,
} from "../../lib/puzzle";
import { loadDailyGameState, saveDailyGameState } from "../../lib/puzzle/local-game-storage";
import { Pool } from "../pool/Pool";
import { SubmissionArea } from "../submission-area/SubmissionArea";
import { HistoryArea } from "../history-area/HistoryArea";
import { NavBar } from "../nav-bar/NavBar";
import { InstructionsScreen } from "../instructions-screen/InstructionsScreen";
import { SettingsPanel } from "../settings-panel/SettingsPanel";
import { WinPanel } from "../win-panel/WinPanel";
import type { GameState } from "../../context/game";
import styles from "./App.module.css";

/** Props for the application root. */
type AppProps = {
  /** Optional prebuilt game state, mainly used by tests. */
  initialState?: GameState;
};

type DailyGameData = {
  /** Local date that scopes today's persisted games. */
  date: string;
  /** One independent game state per difficulty. */
  states: Partial<Record<Difficulty, GameState>>;
};

type InstructionsDisclosure = {
  /** Whether the instructions overlay is currently open. */
  isOpen: boolean;
  /** Toggles the instructions overlay. */
  onToggle: () => void;
};

const HAS_SEEN_INSTRUCTIONS_STORAGE_KEY = "binglebingle:has-seen-instructions";
const FALLBACK_DAILY_WORDS = {
  3: createWord("외계인")!,
  4: createWord("전화위복")!,
  5: createWord("자동판매기")!,
} satisfies Record<Difficulty, NonNullable<ReturnType<typeof createWord>>>;

export function App({ initialState }: AppProps = {}) {
  const instructionsDisclosure = useFirstVisitInstructions();

  if (initialState !== undefined) {
    const initialDifficulty = difficultyForState(initialState);
    return (
      <GameApp
        initialState={initialState}
        activeDifficulty={initialDifficulty}
        instructionsDisclosure={instructionsDisclosure}
      />
    );
  }

  return <DailyGameApp instructionsDisclosure={instructionsDisclosure} />;
}

function DailyGameApp({
  instructionsDisclosure,
}: {
  /** Shared first-visit instructions disclosure state. */
  instructionsDisclosure: InstructionsDisclosure;
}) {
  const [dailyGameData, setDailyGameData] = useState<DailyGameData | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>(3);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function initializeDailyGames() {
      try {
        const date = todayIso();
        // TODO: Re-check the local date when the app stays open across midnight.
        const states: Partial<Record<Difficulty, GameState>> = {};

        for (const difficulty of DIFFICULTIES) {
          const schedule = await loadDailyWords(difficulty);
          const targetWord = selectDailyWord(schedule, date) ?? FALLBACK_DAILY_WORDS[difficulty];

          states[difficulty] =
            loadDailyGameState({ date, difficulty, targetWord }) ??
            createInitialGameState(targetWord);
        }

        if (!isCancelled) setDailyGameData({ date, states });
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : "단어를 불러오지 못했습니다.");
        }
      }
    }

    void initializeDailyGames();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (loadError !== null) {
    return (
      <AppShell activeDifficulty={activeDifficulty} instructionsDisclosure={instructionsDisclosure}>
        {loadError}
      </AppShell>
    );
  }
  if (dailyGameData === null) {
    return (
      <AppShell activeDifficulty={activeDifficulty} instructionsDisclosure={instructionsDisclosure}>
        {null}
      </AppShell>
    );
  }

  const activeState = dailyGameData.states[activeDifficulty];
  if (activeState === undefined) {
    return (
      <AppShell activeDifficulty={activeDifficulty} instructionsDisclosure={instructionsDisclosure}>
        {null}
      </AppShell>
    );
  }

  function handleStateChange(nextState: GameState) {
    setDailyGameData((currentData) => {
      if (currentData === null) return currentData;
      saveDailyGameState({
        date: currentData.date,
        difficulty: activeDifficulty,
        state: nextState,
      });
      return {
        ...currentData,
        states: { ...currentData.states, [activeDifficulty]: nextState },
      };
    });
  }

  return (
    <GameApp
      key={activeDifficulty}
      initialState={activeState}
      activeDifficulty={activeDifficulty}
      onSelectDifficulty={setActiveDifficulty}
      onStateChange={handleStateChange}
      instructionsDisclosure={instructionsDisclosure}
      celebrationScope={`${dailyGameData.date}:${activeDifficulty}`}
      shareDate={dailyGameData.date}
    />
  );
}

type AppShellProps = {
  /** Currently selected word length difficulty. */
  activeDifficulty?: Difficulty | undefined;
  /** Called when a difficulty button is selected. */
  onSelectDifficulty?: ((difficulty: Difficulty) => void) | undefined;
  /** Shared instructions disclosure state. */
  instructionsDisclosure: InstructionsDisclosure;
  /** Whether context-backed game regions should render. */
  isGameReady?: boolean;
  /** Main game content. */
  children: ReactNode;
};

function AppShell({
  activeDifficulty,
  onSelectDifficulty,
  instructionsDisclosure,
  isGameReady = false,
  children,
}: AppShellProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  function handleToggleSettings() {
    setIsSettingsOpen((currentIsOpen) => !currentIsOpen);
  }

  function handleClearLocalStorage() {
    clearBinglebingleLocalStorage();
    window.location.reload();
  }

  return (
    <div className={styles.app}>
      <div className={styles.gameShell}>
        <NavBar
          onToggleInstructions={instructionsDisclosure.onToggle}
          isInstructionsOpen={instructionsDisclosure.isOpen}
          onToggleSettings={handleToggleSettings}
          isSettingsOpen={isSettingsOpen}
          activeDifficulty={activeDifficulty}
          onSelectDifficulty={onSelectDifficulty}
        />
        <InstructionsScreen
          isOpen={instructionsDisclosure.isOpen}
          onClose={instructionsDisclosure.onToggle}
        />
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={handleToggleSettings}
          onClearLocalStorage={handleClearLocalStorage}
        />
        <div className={styles.gameArea}>
          {isGameReady ? <HistoryArea /> : null}
          <div className={styles.gameContent}>{children}</div>
        </div>
      </div>
    </div>
  );
}

type GameAppProps = {
  /** Initial state passed to the root GameProvider for this mounted game session. */
  initialState: GameState;
  /** Currently selected word length difficulty. */
  activeDifficulty?: Difficulty | undefined;
  /** Called when a difficulty button is selected. */
  onSelectDifficulty?: ((difficulty: Difficulty) => void) | undefined;
  /** Called when reducer state changes. */
  onStateChange?: ((state: GameState) => void) | undefined;
  /** Shared instructions disclosure state. */
  instructionsDisclosure: InstructionsDisclosure;
  /** Stable scope for suppressing duplicate automatic win celebrations. */
  celebrationScope?: string | undefined;
  /** Local puzzle date used in copied share text. */
  shareDate?: string | undefined;
};

function GameApp({
  initialState,
  activeDifficulty,
  onSelectDifficulty,
  onStateChange,
  instructionsDisclosure,
  celebrationScope,
  shareDate,
}: GameAppProps) {
  return (
    <GameProvider initialState={initialState} onStateChange={onStateChange}>
      <AppShell
        activeDifficulty={activeDifficulty}
        onSelectDifficulty={onSelectDifficulty}
        instructionsDisclosure={instructionsDisclosure}
        isGameReady
      >
        <GameContent celebrationScope={celebrationScope} shareDate={shareDate} />
      </AppShell>
    </GameProvider>
  );
}

function GameContent({
  celebrationScope,
  shareDate,
}: {
  celebrationScope?: string | undefined;
  shareDate?: string | undefined;
}) {
  const { state } = useGame();

  if (isWon(state.history)) {
    return (
      <>
        <SubmissionArea isInteractionDisabled isSubmitVisible={false} isWinDanceEnabled />
        <WinPanel celebrationScope={celebrationScope} shareDate={shareDate} />
      </>
    );
  }

  return (
    <>
      <SubmissionArea />
      <Pool />
    </>
  );
}

function useFirstVisitInstructions(): InstructionsDisclosure {
  const [isOpen, setIsOpen] = useState(() => !hasSeenInstructions());

  useEffect(() => {
    if (isOpen) markInstructionsSeen();
  }, [isOpen]);

  function handleToggle() {
    setIsOpen((currentIsOpen) => !currentIsOpen);
  }

  return { isOpen, onToggle: handleToggle };
}

function hasSeenInstructions(): boolean {
  const storage = getLocalStorage();
  return storage?.getItem(HAS_SEEN_INSTRUCTIONS_STORAGE_KEY) === "true";
}

function markInstructionsSeen(): void {
  const storage = getLocalStorage();
  try {
    storage?.setItem(HAS_SEEN_INSTRUCTIONS_STORAGE_KEY, "true");
  } catch {
    // Ignore storage failures; instructions can still be toggled for this session.
  }
}

function clearBinglebingleLocalStorage(): void {
  const storage = getLocalStorage();
  if (storage === null) return;

  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
    (key): key is string => key !== null && key.startsWith("binglebingle:"),
  );
  for (const key of keys) storage.removeItem(key);
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function difficultyForState(state: GameState): Difficulty | undefined {
  return isSupportedDifficulty(state.targetWord.length) ? state.targetWord.length : undefined;
}
