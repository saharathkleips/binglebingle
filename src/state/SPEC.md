# SPEC: State

**Status:** draft
**Slice:** `src/state/`

## Purpose

Two responsibilities: the game state machine (reducer + context) and game setup (word loading and initialization).

**State machine** — manages `GameState` via `useReducer`. The reducer is the structural rule enforcer: it ensures only valid state transitions occur. Complementary to the engine — the reducer enforces what states are _reachable_, the engine evaluates what a state _means_.

**Game setup** — loads words, selects a word, constructs initial state. The only part of the codebase that performs I/O (`fetch`).

**Boundaries:**

- State machine: in → `GameAction`, out → `GameState`. Calls into `src/lib/jamo/` and `src/lib/character/`. No I/O.
- Game setup: in → `WordSelectionStrategy`, out → `GameState`. Calls `fetch`. Calls into `src/lib/word/`.

## File Map

```
src/state/
├── types.ts              # GameState, GameAction, PoolToken, SubmissionSlot
├── game-reducer.ts       # gameReducer(), createInitialGameState()
├── GameContext.tsx        # GameProvider, useGame()
├── game-reducer.test.ts
└── README.md
```

## Types

```typescript
import type { GuessRecord } from "../lib/engine/types";
import type { Word } from "../lib/word/word";
import type { Character } from "../lib/character/character";

export type PoolToken = {
  id: number; // stable index into original pool array — never changes
  character: Character;
};

export type PoolState = readonly PoolToken[];

export type SubmissionSlot =
  | { filled: true; tokenId: number; character: Character }
  | { filled: false };

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
  | { type: "PLACE_TOKEN"; payload: { tokenId: number; slotIndex: number } }
  | { type: "REMOVE_FROM_SLOT"; payload: { slotIndex: number } }
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

**`SPLIT_TOKEN`** — decomposes a multi-jamo token back into individual single-jamo tokens. All pool token ids are reassigned from scratch (0, 1, 2, …) after split.

**`PLACE_TOKEN`** — moves token from pool to submission slot. Removes from `pool`, sets slot to filled.

**`REMOVE_FROM_SLOT`** — returns token from submission slot to pool. Sets slot to `{ filled: false }`.

**`SUBMIT_GUESS`** — receives pre-computed `GuessRecord` in payload, appends to `guesses`, resets pool and submission. Reducer does not compute evaluation.

**`RESET_ROUND`** — resets pool and submission without appending to guesses.

## Invariants

- `submission.length === [...state.word].length` at all times
- `pool` and `submission` are reset after `SUBMIT_GUESS`
- `guesses` grows by one record per `SUBMIT_GUESS`
- Token `id` values are stable across rotation/combination; reassigned from scratch after `SPLIT_TOKEN`

## Key Decisions

**S0 — No fall-through between reducer cases.** Each case must be self-contained. Extract a shared helper function instead of falling through.

**S1 — Reducer does not evaluate guesses.** `SUBMIT_GUESS` receives a pre-computed `GuessRecord`. Evaluation is the engine's job.

**S2 — `SPLIT_TOKEN` reassigns all pool ids from scratch.** No id counter in state. IDs are position-stable during a round but reset after split.

**S3 — Partial submission is valid.** Empty slots evaluate as `'absent'`. The player does not need to fill every slot.

**S4 — `DevSettings` live in application state, not game state.** Not persisted to localStorage.

```typescript
type DevSettings = {
  enabled: boolean;
  strategy: WordSelectionStrategy;
};
```
