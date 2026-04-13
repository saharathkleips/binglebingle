# state

Game state machine for Binglebingle. Single `useReducer` + `GameContext` — the only place in the app that holds mutable game state.

## Contracts

- `GameProvider` — wraps the app; initialises game state on mount
- `useGame()` — typed context hook; the only way components access state and dispatch
- `GameState` — current game state (word, pool, submission, guesses)
- `GameAction` — discriminated union of all valid actions; every action type is listed here
- Reducer is pure — no async, no side effects; evaluation is delegated to `src/lib/engine/`

## Dependencies

- `src/lib/jamo/` — jamo operations
- `src/lib/character/` — character operations
- `src/lib/word/` — word loading and selection (I/O lives here, not in the reducer)
