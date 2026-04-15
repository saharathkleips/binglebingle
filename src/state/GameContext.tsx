/**
 * @file GameContext.tsx
 *
 * React context and hook for game state. The sole entry point for components
 * that need to read or mutate game state.
 */

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { gameReducer } from "./game-reducer";
import type { GameState, GameAction } from "./types";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type GameContextValue = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

const GameContext = createContext<GameContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export type GameProviderProps = {
  initialState: GameState;
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
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
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
