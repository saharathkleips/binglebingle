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
├── game.ts                  # GameState, GameAction, PoolToken, PoolState, SubmissionSlot, SubmissionState
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

export type PoolToken = {
  id: number; // stable index into original pool array — never changes
  character: Character;
};

export type PoolState = readonly PoolToken[];

export type SubmissionSlot =
  | { state: "FILLED"; tokenId: number; character: Character }
  | { state: "EMPTY" };

export type SubmissionState = readonly SubmissionSlot[]; // length always === [...word].length

export type GameState = {
  word: Word;
  pool: PoolState;
  submission: SubmissionState;
  guesses: readonly GuessRecord[];
};

export type GameAction =
  | { type: "ROTATE_TOKEN"; payload: { tokenId: number; targetJamo: string } }
  | { type: "COMBINE_TOKENS"; payload: { tokenIdA: number; tokenIdB: number } }
  | { type: "SPLIT_TOKEN"; payload: { tokenId: number } }
  | { type: "SUBMISSION_SLOT_INSERT"; payload: { tokenId: number; slotIndex: number } }
  | { type: "SUBMISSION_SLOT_REMOVE"; payload: { slotIndex: number } }
  | { type: "SUBMIT_GUESS"; payload: { evaluation: GuessRecord } }
  | { type: "RESET_ROUND" };
```

`won` is derived, never stored:

```typescript
function isWon(state: GameState): boolean {
  const last = state.guesses.at(-1);
  return last !== undefined && last.every((e) => e.result === "correct");
}
```

No `status` field, no `'idle'` state. The application layer controls whether a game is active by deciding whether to render the game component.

## Action Semantics

**`ROTATE_TOKEN`** — changes the jamo of a single-jamo pool token to `targetJamo`. Only valid for single-jamo tokens. No-op if token is not single-jamo.

**`COMBINE_TOKENS`** — two cases:

1. _Pool combination_: both tokens are standalone single-jamo pool tokens → calls `combineJamo`. No-op if result is null.
2. _Jongseong upgrade_: token A is a complete syllable with single jongseong, token B is a consonant → calls `upgradeJongseong`. No-op if result is null.

If neither case applies, no-op.

**`SPLIT_TOKEN`** — decomposes a multi-jamo token back into two single-jamo tokens. The original token is updated in place with the first part (retaining its id); the second part is appended to the pool with the next available id.

**`SUBMISSION_SLOT_INSERT`** — moves token from pool to submission slot. Removes from `pool`, sets slot to filled.

**`SUBMISSION_SLOT_REMOVE`** — returns token from submission slot to pool. Sets slot to `{ state: "EMPTY" }`.

**`SUBMIT_GUESS`** — receives pre-computed `GuessRecord` in payload, appends to `guesses`, resets pool and submission. Reducer does not compute evaluation.

**`RESET_ROUND`** — resets pool and submission without appending to guesses.

## Invariants

- `submission.length === [...state.word].length` at all times
- `pool` and `submission` are reset after `SUBMIT_GUESS`
- `guesses` grows by one record per `SUBMIT_GUESS`
- Token `id` values are stable across rotation/combination/decompose; the original token keeps its id on split, only the new part gets a fresh id

## Key Decisions

**S0 — No fall-through between reducer cases.** Each case must be self-contained. Extract a shared helper function instead of falling through.

**S1 — Reducer does not evaluate guesses.** `SUBMIT_GUESS` receives a pre-computed `GuessRecord`. Evaluation is the engine's job.

**S2 — `SPLIT_TOKEN` preserves the original token's id.** The original token is updated in place; only the second part needs a new id (next available). No id counter in state — derived from the pool on demand.

**S3 — Partial submission is valid.** Empty slots evaluate as `'absent'`. The player does not need to fill every slot.

**S4 — `DevSettings` live in application state, not game state.** Not persisted to localStorage.

```typescript
type DevSettings = {
  enabled: boolean;
  strategy: WordSelectionStrategy;
};
```
