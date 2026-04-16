# SPEC: context/game

**Status:** draft
**Slice:** `src/context/game/`

## Purpose

Two responsibilities: the game state machine (reducer + context) and game setup (word loading and initialization).

**State machine** — manages `GameState` via `useReducer`. The reducer is the structural rule enforcer: it ensures only valid state transitions occur. Complementary to the engine — the reducer enforces what states are _reachable_, the engine evaluates what a state _means_.

**Game setup** — loads words, selects a word, constructs initial state. The only part of the codebase that performs I/O (`fetch`).

**Boundaries:**

- State machine: in → `GameAction`, out → `GameState`. Calls into `src/lib/jamo/` and `src/lib/character/`. No I/O.
- Game setup: in → `WordSelectionStrategy`, out → `GameState`. Calls `fetch`. Calls into `src/lib/word/`.

## File Map

```
src/context/game/
├── game.ts                  # GameState, GameAction, Tile, SubmissionSlot
├── character-actions.ts     # handleCharacterRotateNext, handleCharacterCompose, handleCharacterDecompose
├── submission-actions.ts    # handleSubmissionSlotInsert, handleSubmissionSlotRemove
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
import type { Character } from "../lib/character/character";

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

## Action Semantics

**`ROTATE_TOKEN`** — changes the jamo of a single-jamo pool tile to the next in its rotation set. No-op if tile is not single-jamo or not rotatable.

**`COMBINE_TOKENS`** — two cases:

1. _Pool combination_: both tiles are standalone single-jamo pool tiles → calls `combineJamo`. No-op if result is null.
2. _Jongseong upgrade_: tile A is a complete syllable with single jongseong, tile B is a consonant → calls `upgradeJongseong`. No-op if result is null.

If neither case applies, no-op.

**`SPLIT_TOKEN`** — decomposes a multi-jamo tile back into two single-jamo tiles. The original tile is updated in place with the first part (retaining its id); the second part is appended to the pool with the next available id.

**`SUBMISSION_SLOT_INSERT`** — moves tile from pool to submission slot. Removes from `pool`, sets slot to filled.

**`SUBMISSION_SLOT_REMOVE`** — returns tile from submission slot to pool. Sets slot to `{ state: "EMPTY" }`.

**`ROUND_SUBMISSION_SUBMIT`** — evaluates `state.submission` against `state.targetWord` internally, appends the result to `history`. Correct and present slots remain filled; absent tiles are fully decomposed and returned to the pool. No payload — evaluation is never caller-supplied.

**`ROUND_RESET`** — resets pool and submission without appending to history.

## Invariants

- `submission.length === [...state.targetWord].length` at all times
- Correct and present slots remain filled after `ROUND_SUBMISSION_SUBMIT`; absent tiles are returned to pool fully decomposed
- `history` grows by one record per `ROUND_SUBMISSION_SUBMIT`
- Tile `id` values are stable across rotation/combination/decompose; the original tile keeps its id on split, only the new part gets a fresh id

## Key Decisions

**S0 — No fall-through between reducer cases.** Each case must be self-contained. Extract a shared helper function instead of falling through.

**S1 — Evaluation is computed inside the reducer.** `ROUND_SUBMISSION_SUBMIT` carries no payload; the reducer calls `evaluateGuess` against its own `state.submission` and `state.targetWord`. This prevents callers from dispatching a mismatched or fabricated evaluation.

**S2 — `SPLIT_TOKEN` preserves the original tile's id.** The original tile is updated in place; only the second part needs a new id (next available). No id counter in state — derived from the pool on demand.

**S3 — Partial submission is valid.** Empty slots evaluate as `'absent'`. The player does not need to fill every slot.

**S4 — `DevSettings` live in application state, not game state.** Not persisted to localStorage.

```typescript
type DevSettings = {
  enabled: boolean;
  strategy: WordSelectionStrategy;
};
```
