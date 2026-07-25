/**
 * @file GameContext.tsx
 *
 * React context and hook for game state. The sole entry point for components
 * that need to read or mutate game state.
 */

import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
} from "react";
import { gameReducer } from "./game-reducer";
import type { GameState, GameAction } from ".";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/** Props for the root game state provider. */
export type GameProviderProps = {
  /** Initial reducer state for the mounted game session. */
  initialState: GameState;
  /** Component subtree that reads game state through `useGame`. */
  children: ReactNode;
};

/**
 * Wraps a component tree with game state. Mount once at the root of the game
 * view; pass the initial state produced by `createInitialGameState`.
 *
 * @param props.initialState - Initial game state (from `createInitialGameState`)
 * @param props.children - Component subtree that needs game state
 */
export function GameProvider({ initialState, children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [inputLockCount, setInputLockCount] = useState(0);
  const historyAreaRef = useRef<HTMLElement>(null);
  const isInputLocked = inputLockCount > 0;

  const acquireInputLock = useCallback(() => {
    let hasReleased = false;
    setInputLockCount((currentCount) => currentCount + 1);

    return () => {
      if (hasReleased) return;

      hasReleased = true;
      setInputLockCount((currentCount) => Math.max(0, currentCount - 1));
    };
  }, []);

  return (
    <GameContext.Provider
      value={{ state, dispatch, isInputLocked, acquireInputLock, historyAreaRef }}
    >
      {children}
    </GameContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the current game state and dispatch function.
 * Must be called inside a `GameProvider`.
 *
 * @returns `{ state, dispatch }` from the nearest GameProvider
 * @throws If called outside a GameProvider
 */
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (ctx === null) throw new Error("useGame must be called inside a GameProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

type GameContextValue = {
  /** Current game reducer state. */
  state: GameState;
  /** Reducer dispatch function for game actions. */
  dispatch: Dispatch<GameAction>;
  /** Whether player interactions should be ignored while a UI transition is committing. */
  isInputLocked: boolean;
  /** Acquires an input lock and returns an idempotent release callback. */
  acquireInputLock: () => () => void;
  /** History scroll container used by submit reveal animation as its destination. */
  historyAreaRef: RefObject<HTMLElement | null>;
};

const GameContext = createContext<GameContextValue | null>(null);
