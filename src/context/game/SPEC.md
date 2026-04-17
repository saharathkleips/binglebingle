# SPEC: context/game

**Status:** draft

## Purpose

Two responsibilities: the game state machine (reducer + context) and game setup (word loading and initialization).

**State machine** — manages `GameState` via `useReducer`. The reducer is the structural rule enforcer: it ensures only valid state transitions occur. Complementary to the engine — the reducer enforces what states are _reachable_, the engine evaluates what a state _means_.

**Game setup** — loads words, selects a word, constructs initial state. The only part of the codebase that performs I/O (`fetch`).

**Boundaries:**

- State machine: in → `GameAction`, out → `GameState`. Calls into `src/lib/jamo/` and `src/lib/character/`. No I/O.
- Game setup: in → `WordSelectionStrategy`, out → `GameState`. Calls `fetch`. Calls into `src/lib/word/`.

## File Map

```
game/
├── game.ts                  # GameState, GameAction, Tile, SubmissionSlot
├── character-actions.ts     # handleCharacterRotateNext, handleCharacterCompose, handleCharacterDecompose
├── submission-actions.ts    # handleSubmissionSlotInsert, handleSubmissionSlotRemove, handleSubmissionSlotMove
├── round-actions.ts         # handleSubmitGuess, handleResetRound, buildInitialPool, buildEmptySubmission
├── game-reducer.ts          # gameReducer() (shallow router), createInitialGameState()
├── GameContext.tsx           # GameProvider, useGame()
├── game-reducer.test.ts
└── README.md
```

`game.ts` is the public surface — shared types consumed across the slice and by external consumers. No internal slice imports.

Per-action payload types live colocated with their handler files and import shared types from `game.ts` as needed.

`game-reducer.ts` stays separate from `GameContext.tsx` to preserve the pure/React boundary — the reducer is non-React logic and should not live in a `.tsx` file.

## Types

```typescript
import type { GuessRecord } from "../lib/engine/engine";
import type { Word } from "../lib/word/word";
import type { Character } from "../lib/character";

export type Tile = {
  id: number; // stable index into original pool array — never changes
  character: Character;
};

export type SubmissionSlot =
  | { state: "FILLED"; tileId: number; character: Character }
  | { state: "EMPTY" };

export type GameState = {
  targetWord: Word;
  pool: readonly Tile[];
  submission: readonly SubmissionSlot[];
  history: readonly GuessRecord[];
};

export type GameAction =
  | { type: "CHARACTER_ROTATE_NEXT"; payload: { tileId: number } }
  | { type: "CHARACTER_COMPOSE"; payload: { targetId: number; incomingId: number } }
  | { type: "CHARACTER_DECOMPOSE"; payload: { tileId: number } }
  | { type: "SUBMISSION_SLOT_INSERT"; payload: { tileId: number; slotIndex: number } }
  | { type: "SUBMISSION_SLOT_REMOVE"; payload: { slotIndex: number } }
  | { type: "SUBMISSION_SLOT_MOVE"; payload: { fromSlotIndex: number; toSlotIndex: number } }
  | { type: "ROUND_SUBMISSION_SUBMIT" }
  | { type: "ROUND_RESET" };
```

`won` is derived, never stored:

```typescript
function isWon(state: GameState): boolean {
  const last = state.history.at(-1);
  return last !== undefined && last.every((e) => e.result === "correct");
}
```

No `status` field, no `'idle'` state. The application layer controls whether a game is active by deciding whether to render the game component.

## Functions

### gameReducer(state, action) => GameState

Shallow routing switch — dispatches each action type to its dedicated handler. Returns state unchanged for invalid or no-op actions. Each case is self-contained; no fall-through.

### createInitialGameState(word) => GameState

Builds the initial `GameState` for a given word. Delegates pool construction to `buildInitialPool` and submission sizing to `buildEmptySubmission`.

### buildInitialPool(word) => readonly Tile[]

Fully decomposes each character in the word and normalizes each jamo to the canonical (base) member of its rotation set. Normalization prevents the pool from hinting which specific rotated form the target word uses.

### buildEmptySubmission(word) => readonly SubmissionSlot[]

Builds an all-`EMPTY` submission array sized to match the character count of the word.

### handleCharacterRotateNext(state, payload) => GameState

Advances a single-jamo pool tile to the next jamo in its rotation set by calling `getNextRotation`. No-op if the tile is not found, is not single-jamo, or is not rotatable (`getNextRotation` returns null).

### handleCharacterCompose(state, payload) => GameState

Merges two pool tiles into one by calling `compose(targetTile, incomingTile)`. The combined tile takes the id of `targetId`; `incomingId` is removed from the pool. No-op if either tile is not found or `compose` returns null.

### handleCharacterDecompose(state, payload) => GameState

Decomposes a multi-jamo pool tile back into two individual tiles by calling `decompose`. The original tile is updated in place (retaining its id and position) with the first part; the second part is appended to the end of the pool with the smallest available id. No-op if the tile is not found or `decompose` returns null.

**Key decision:** The original tile keeps its id on decompose; only the new part needs a fresh id. Fresh ids are derived from the pool on demand (`nextMissingId`) — no stored counter in state.

### handleSubmissionSlotInsert(state, payload) => GameState

Moves a tile from the pool into a submission slot. If the destination slot is already filled, the existing tile is returned to the pool before the new tile is placed. No-op if the tile is not found or the slot index is out of bounds.

### handleSubmissionSlotMove(state, payload) => GameState

Moves a tile from one submission slot to another without a pool round-trip. If the destination slot is filled, the two tiles are swapped. No-op if either index is out of bounds or the source slot is empty.

### handleSubmissionSlotRemove(state, payload) => GameState

Returns the tile in a submission slot to the pool and marks the slot `EMPTY`. No-op if the slot is already empty or the index is out of bounds.

### handleSubmitGuess(state) => GameState

Evaluates `state.submission` against `state.targetWord` by calling `evaluateGuess`, then appends the result to `history`. Correct and present slots remain filled; absent slots are cleared and their tiles are fully decomposed (without normalizing) and returned to the pool. Extra parts from decomposition receive fresh ids derived from all currently-in-use ids.

**Key decisions:**

- No payload — evaluation is computed inside the reducer against its own `state.submission` and `state.targetWord`. This prevents callers from dispatching a mismatched or fabricated evaluation.
- Partial submission is valid: empty slots evaluate as `'absent'`. The player does not need to fill every slot before submitting.

### handleResetRound(state) => GameState

Rebuilds the pool from the target word and clears all submission slots. Does not append to `history`.

## Key Decisions

**No fall-through between reducer cases.** Each case in `gameReducer` must be self-contained. Extract a shared helper function instead of falling through.

**`DevSettings` live in application state, not game state.** Not persisted to localStorage.

```typescript
type DevSettings = {
  enabled: boolean;
  strategy: WordSelectionStrategy;
};
```
