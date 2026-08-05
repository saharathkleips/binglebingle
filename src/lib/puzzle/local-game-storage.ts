import type { GameState } from "../../context/game";
import { wordToString } from "../word";
import type { Word } from "../word";
import type { Difficulty } from ".";

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = "binglebingle:daily-state";

type StoredDailyGameState = {
  version: typeof STORAGE_VERSION;
  date: string;
  difficulty: Difficulty;
  targetWord: string;
  state: GameState;
};

/** Loads a locally persisted daily game state for the exact date/difficulty/word. */
export function loadDailyGameState(params: {
  date: string;
  difficulty: Difficulty;
  targetWord: Word;
}): GameState | null {
  const storage = getLocalStorage();
  if (storage === null) return null;

  const raw = storage.getItem(storageKey(params.date, params.difficulty));
  if (raw === null) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredDailyGameState>;
    const targetWord = wordToString(params.targetWord);
    if (
      parsed.version !== STORAGE_VERSION ||
      parsed.date !== params.date ||
      parsed.difficulty !== params.difficulty ||
      parsed.targetWord !== targetWord ||
      !isGameStateForWord(parsed.state, params.targetWord)
    ) {
      return null;
    }
    return parsed.state;
  } catch {
    return null;
  }
}

/** Persists a daily game state locally for later refreshes in the same browser. */
export function saveDailyGameState(params: {
  date: string;
  difficulty: Difficulty;
  state: GameState;
}): void {
  const storage = getLocalStorage();
  if (storage === null) return;

  const storedState: StoredDailyGameState = {
    version: STORAGE_VERSION,
    date: params.date,
    difficulty: params.difficulty,
    targetWord: wordToString(params.state.targetWord),
    state: params.state,
  };

  try {
    storage.setItem(storageKey(params.date, params.difficulty), JSON.stringify(storedState));
  } catch {
    // Ignore quota/security errors; local persistence is best-effort.
  }
}

function storageKey(date: string, difficulty: Difficulty): string {
  return `${STORAGE_PREFIX}:${date}:${difficulty}`;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isGameStateForWord(state: unknown, targetWord: Word): state is GameState {
  if (typeof state !== "object" || state === null) return false;
  const candidate = state as Partial<GameState>;
  return (
    Array.isArray(candidate.targetWord) &&
    wordToString(candidate.targetWord) === wordToString(targetWord) &&
    Array.isArray(candidate.pool) &&
    Array.isArray(candidate.submission) &&
    candidate.submission.length === targetWord.length &&
    Array.isArray(candidate.history)
  );
}
