# context/game

Game state machine for Binglebingle. Single `useReducer` + `GameContext` — the only place in the app that holds mutable game state.

## Exports

- `GameProvider` — wraps the game view; accepts `initialState` from `createInitialGameState`
- `useGame() => { state: GameState, dispatch: Dispatch<GameAction> }` — typed context hook; the only way components read state or dispatch actions; throws if called outside `GameProvider`
- `createInitialGameState(word) => GameState` — builds initial state for a round: fully decomposes the word into a normalized jamo pool and creates an empty submission
- `GameState` — current game state (`targetWord`, `pool`, `submission`, `history`)
- `GameAction` — discriminated union of all valid actions: `CHARACTER_ROTATE_NEXT`, `CHARACTER_COMPOSE`, `CHARACTER_DECOMPOSE`, `SUBMISSION_SLOT_INSERT`, `SUBMISSION_SLOT_MOVE`, `SUBMISSION_SLOT_REMOVE`, `ROUND_SUBMISSION_SUBMIT`, `ROUND_RESET`
- `Tile` — a single pool entry: stable `id` and current `character`
- `SubmissionSlot` — either `EMPTY` or `FILLED` with a tile reference and its current `character`
