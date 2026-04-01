# plan-game.md
> Game Domain — Implementation Plan
> Depends on: plan-models.md, plan-jamo.md, plan-word.md, plan-engine.md
> Status: draft — awaiting review

---

## What This Domain Does

Two responsibilities, kept in separate files:

**State machine** (`src/state/`): manages `GameState` via `useReducer`. The reducer is the structural rule enforcer — it ensures only valid state transitions occur. It is complementary to the engine: the reducer enforces what states are *reachable*, the engine evaluates what a state *means*. Together they form the complete rule system. No action should produce a state that violates a game invariant.

**Game setup** (`src/lib/game/`): loads words, selects a word for the session, and constructs initial game state. This is the only part of the codebase that performs I/O (`fetch`).

**Boundaries:**
- State machine: in → `GameAction`, out → `GameState`. Calls into `src/lib/jamo/` and `src/lib/character/` for combinatorial validity. No I/O.
- Game setup: in → nothing / `WordSelectionStrategy`, out → `Word`, `GameState`. Calls `fetch`. Calls into `src/lib/word/`.

---

## File Map

```
src/state/
├── types.ts              # GameState, GameAction, all state-layer types
├── game-reducer.ts       # gameReducer(), createInitialGameState()
├── GameContext.tsx        # context provider + useGame() hook
└── game-reducer.test.ts

src/lib/game/
├── loader.ts             # loadWords(), selectWord()
├── setup.ts              # setupGame() — composes loading + state init
├── loader.test.ts
└── setup.test.ts
```

---

## Part 1: State Machine

### Step 1 — `state/types.ts`

All state-layer types. Engine types (`GuessRecord`, `EvaluatedCharacter`, `CharacterResult`) are imported from `src/lib/engine/types.ts`.

```typescript
import type { GuessRecord } from '../lib/engine/types'
import type { Word } from '../lib/word/types'

// A single jamo token in the pool
export type PoolToken = {
  id: number          // stable index — position in the original pool array
  character: Character
}

export type PoolState = readonly PoolToken[]

// A submission slot — either occupied or empty
export type SubmissionSlot =
  | { filled: true;  tokenId: number; character: Character }
  | { filled: false }

export type SubmissionState = readonly SubmissionSlot[]

export type GameState = {
  word: Word
  pool: PoolState
  submission: SubmissionState
  guesses: readonly GuessRecord[]
}

// All valid actions — discriminated union keyed on `type`
export type GameAction =
  | { type: 'ROTATE_TOKEN';     payload: { tokenId: number; targetJamo: string } }
  | { type: 'COMBINE_TOKENS';   payload: { tokenIdA: number; tokenIdB: number } }
  | { type: 'SPLIT_TOKEN';      payload: { tokenId: number } }
  | { type: 'PLACE_TOKEN';      payload: { tokenId: number; slotIndex: number } }
  | { type: 'REMOVE_FROM_SLOT'; payload: { slotIndex: number } }
  | { type: 'SUBMIT_GUESS';     payload: { evaluation: GuessRecord } }
  | { type: 'RESET_ROUND' }
```

`Character` is imported from `src/lib/character/types.ts`.

---

### Step 2 — `state/game-reducer.ts`

#### `createInitialGameState`

```typescript
import { normalizePool, derivePool } from '../lib/word/word'

export function createInitialGameState(word: Word): GameState {
  const poolJamo = normalizePool(derivePool(word))
  return {
    word,
    pool: poolJamo.map((jamo, id) => ({
      id,
      character: { jamo: [jamo] },
    })),
    submission: Array.from({ length: [...word].length }, () => ({ filled: false })),
    guesses: [],
  }
}
```

#### `gameReducer`

The reducer handles each action. Invalid actions (where preconditions are not met) return state unchanged — they are silent no-ops. The UI is responsible for only dispatching valid actions based on the current state.

```typescript
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'ROTATE_TOKEN': {
      const { tokenId, targetJamo } = action.payload
      const token = state.pool.find(t => t.id === tokenId)
      // Preconditions: token exists, is single-jamo, targetJamo is a valid rotation
      if (!token) return state
      if (token.character.jamo.length !== 1) return state
      const currentJamo = token.character.jamo[0]
      if (!getRotationOptions(currentJamo).includes(targetJamo)) return state

      return {
        ...state,
        pool: state.pool.map(t =>
          t.id === tokenId
            ? { ...t, character: { jamo: [targetJamo] } }
            : t
        ),
      }
    }

    case 'COMBINE_TOKENS': {
      const { tokenIdA, tokenIdB } = action.payload
      const tokenA = state.pool.find(t => t.id === tokenIdA)
      const tokenB = state.pool.find(t => t.id === tokenIdB)
      if (!tokenA || !tokenB) return state

      const jamoA = tokenA.character.jamo
      const jamoB = tokenB.character.jamo

      // Branch 1: both tokens are single-jamo — attempt jamo combination
      if (jamoA.length === 1 && jamoB.length === 1) {
        const combined = combineJamo(jamoA[0], jamoB[0])
        if (combined === null) return state   // no rule — no-op
        return {
          ...state,
          pool: state.pool
            .filter(t => t.id !== tokenIdB)
            .map(t =>
              t.id === tokenIdA
                ? { ...t, character: { jamo: [combined] } }
                : t
            ),
        }
      }

      // Branch 2: token A is a complete character (cho + jung + single jong),
      // token B is a single consonant — attempt jongseong upgrade
      if (jamoA.length === 3 && jamoB.length === 1) {
        const upgraded = upgradeJongseong(jamoA[2], jamoB[0])
        if (upgraded === null) return state   // no rule — no-op
        return {
          ...state,
          pool: state.pool
            .filter(t => t.id !== tokenIdB)
            .map(t =>
              t.id === tokenIdA
                ? { ...t, character: { jamo: [jamoA[0], jamoA[1], upgraded] } }
                : t
            ),
        }
      }

      // All other combinations are invalid — no-op
      return state
    }

    case 'SPLIT_TOKEN': {
      const { tokenId } = action.payload
      const token = state.pool.find(t => t.id === tokenId)
      if (!token) return state
      if (token.character.jamo.length <= 1) return state   // nothing to split

      // Perform one-step decomposition
      const splitJamo = decomposeJamo(token.character.jamo[token.character.jamo.length - 1])

      // If the last jamo decomposes, split it off. Otherwise split all jamo into singles.
      // Strategy: remove the token, rebuild the pool with new tokens, reassign all ids.
      let newJamo: string[]
      if (splitJamo.length > 1) {
        // e.g. ['ㄱ','ㅏ','ㄳ'] → ['ㄱ','ㅏ'] + ['ㄱ','ㅅ']
        newJamo = [...token.character.jamo.slice(0, -1), ...splitJamo]
      } else {
        // Token is e.g. ['ㄱ','ㅏ'] — split into ['ㄱ'] and ['ㅏ']
        newJamo = [...token.character.jamo]
      }

      // Produce one new token per jamo in newJamo, replacing the split token
      const newTokens: PoolToken[] = newJamo.map(j => ({
        id: -1,                         // placeholder — ids reassigned below
        character: { jamo: [j] },
      }))

      const rebuiltPool = [
        ...state.pool.filter(t => t.id !== tokenId),
        ...newTokens,
      ].map((t, idx) => ({ ...t, id: idx }))   // reassign all ids

      return { ...state, pool: rebuiltPool }
    }

    case 'PLACE_TOKEN': {
      const { tokenId, slotIndex } = action.payload
      const token = state.pool.find(t => t.id === tokenId)
      if (!token) return state
      if (slotIndex < 0 || slotIndex >= state.submission.length) return state

      return {
        ...state,
        pool: state.pool.filter(t => t.id !== tokenId),
        submission: state.submission.map((slot, i) =>
          i === slotIndex
            ? { filled: true, tokenId, character: token.character }
            : slot
        ),
      }
    }

    case 'REMOVE_FROM_SLOT': {
      const { slotIndex } = action.payload
      const slot = state.submission[slotIndex]
      if (!slot?.filled) return state

      // Return the token to the pool
      const restoredToken: PoolToken = {
        id: slot.tokenId,
        character: slot.character,
      }

      return {
        ...state,
        pool: [...state.pool, restoredToken],
        submission: state.submission.map((s, i) =>
          i === slotIndex ? { filled: false } : s
        ),
      }
    }

    case 'SUBMIT_GUESS': {
      const { evaluation } = action.payload
      // evaluation is pre-computed by the engine before dispatch
      return {
        ...state,
        guesses: [...state.guesses, evaluation],
        pool: createInitialGameState(state.word).pool,
        submission: createInitialGameState(state.word).submission,
      }
    }

    case 'RESET_ROUND': {
      const fresh = createInitialGameState(state.word)
      return {
        ...state,
        pool: fresh.pool,
        submission: fresh.submission,
      }
    }

    default:
      return state
  }
}
```

> **Agent note on SUBMIT_GUESS**: calling `createInitialGameState` twice is wasteful. Extract pool and submission construction into a helper and call it once. The pattern above is for clarity — optimize in implementation.

> **Agent note on SPLIT_TOKEN**: the current implementation splits the last jamo of the character. The UX intent (which jamo gets split off) will be refined later. The reducer supports the operation; the UI will control which token is targeted.

---

### Step 3 — `state/GameContext.tsx`

```typescript
import { createContext, useContext, useReducer } from 'react'
import { gameReducer } from './game-reducer'
import type { GameState, GameAction } from './types'

type GameContextValue = {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({
  initialState,
  children,
}: {
  initialState: GameState
  children: React.ReactNode
}) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

// All components use this hook — never useContext(GameContext) directly
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (ctx === null) throw new Error('useGame must be used within GameProvider')
  return ctx
}
```

`GameProvider` receives `initialState` as a prop — the parent (App) constructs it via `setupGame()` before rendering the provider. This keeps the context free of async concerns.

---

## Part 2: Game Setup

### Step 4 — `src/lib/game/loader.ts`

```typescript
import { createWord } from '../word/word'
import type { Word } from '../word/types'

type WordsFile = {
  version: string
  words: string[]
}

// Fetches and validates the words list. Invalid entries are skipped with a warning.
export async function loadWords(): Promise<Word[]> {
  const url = import.meta.env.BASE_URL + 'data/words.json'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load words: ${res.status}`)
  const data = await res.json() as WordsFile
  return data.words.flatMap(raw => {
    const word = createWord(raw)
    if (word === null) {
      console.warn(`words.json: invalid entry skipped: "${raw}"`)
      return []
    }
    return [word]
  })
}
```

**Gotcha**: `import.meta.env.BASE_URL` is required — not `/data/words.json`. Without this, the path breaks under GitHub Pages where the app is served from `/<repo-name>/`.

---

### Step 5 — `src/lib/game/setup.ts`

```typescript
import { loadWords } from './loader'
import { createInitialGameState } from '../../state/game-reducer'
import type { Word } from '../word/types'
import type { WordSelectionStrategy } from '../word/types'
import type { GameState } from '../../state/types'

// Selects a word from the list according to the strategy.
export function selectWord(
  words: Word[],
  strategy: WordSelectionStrategy,
): Word | null {
  if (words.length === 0) return null
  switch (strategy.kind) {
    case 'daily':   return words[dailyIndex(words.length)] ?? null
    case 'random':  return words[Math.floor(Math.random() * words.length)] ?? null
    case 'fixed':   return words.find(w => w === strategy.word) ?? null
    case 'byDate':  return words[dateIndex(strategy.date, words.length)] ?? null
  }
}

// Top-level setup: load words, select one, return initial game state.
// Throws if words cannot be loaded or list is empty.
export async function setupGame(
  strategy: WordSelectionStrategy = { kind: 'daily' },
): Promise<GameState> {
  const words = await loadWords()
  const word = selectWord(words, strategy)
  if (word === null) throw new Error('No valid words available')
  return createInitialGameState(word)
}

function dailyIndex(total: number): number {
  return dateIndex(new Date().toISOString().slice(0, 10), total)
}

function dateIndex(date: string, total: number): number {
  return date.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % total
}
```

`WordSelectionStrategy` is moved to `src/lib/word/types.ts` — it is a word-selection concept, not a game-state concept. `DevSettings` in the app layer holds a `WordSelectionStrategy` and passes it to `setupGame`.

---

## Test Coverage Required

### `game-reducer.test.ts`

Build helpers:
- `makeToken(id, jamo)` → `PoolToken`
- `makeState(word, poolJamo, submissionLength)` → `GameState`

**`ROTATE_TOKEN`**
- Valid rotation → token's jamo changes
- Token not in pool → no-op
- Token is multi-jamo → no-op
- `targetJamo` not in rotation set → no-op

**`COMBINE_TOKENS`**
- Two single-jamo tokens, valid combination → A updated, B removed
- Two single-jamo tokens, invalid combination → no-op
- Token A is `[cho, jung, jong]`, token B is single consonant, valid upgrade → A's jongseong updated, B removed
- Token A is `[cho, jung, jong]`, token B single consonant, no upgrade rule → no-op
- Any other shape → no-op

**`SPLIT_TOKEN`**
- Token with combined jamo (e.g. `['ㅐ']`) → splits to `['ㅏ']` and `['ㅣ']`, ids reassigned
- Token with compound batchim jongseong (e.g. `['ㅎ','ㅐ','ㄳ']`) → last jamo splits: `['ㅎ','ㅐ']` and `['ㄱ']` and `['ㅅ']`
- Single-jamo token → no-op
- All token ids are contiguous from 0 after split

**`PLACE_TOKEN`**
- Token moved from pool to slot → pool shrinks, slot filled
- Invalid slotIndex → no-op
- Token not in pool → no-op

**`REMOVE_FROM_SLOT`**
- Filled slot → token returned to pool, slot becomes `{ filled: false }`
- Empty slot → no-op

**`SUBMIT_GUESS`**
- Evaluation appended to `guesses`
- Pool and submission reset to initial state
- `guesses` grows by 1

**`RESET_ROUND`**
- Pool and submission reset
- `guesses` unchanged

### `loader.test.ts` / `setup.test.ts`

Mock `fetch` in tests:
- Valid JSON → returns `Word[]` with correct count
- Invalid entries filtered with warning
- `fetch` failure → throws
- `selectWord` with `'fixed'` strategy → returns correct word
- `selectWord` with unknown fixed word → returns null
- `selectWord` with empty list → returns null
- `dateIndex` with same date → always returns same index (stability)

---

## ⚑ Assumptions

**G1 — SPLIT_TOKEN always splits the last jamo**
The current reducer splits the last jamo of a token's character, leaving the rest intact. For example `['ㅎ','ㅐ','ㄴ']` splits to `['ㅎ','ㅐ']` and `['ㄴ']`. This is a provisional choice — the UX may want to split a specific jamo rather than always the last. The reducer can be updated when the interaction model is defined. Confirm provisional behaviour is acceptable.

**G2 — REMOVE_FROM_SLOT restores the token's current character**
When a token is returned from a submission slot to the pool, it retains its current character (possibly rotated or combined). It does not reset to its initial single-jamo state. Confirm.

**G3 — SUBMIT_GUESS resets pool and submission fully**
After submission, pool and submission reset to `createInitialGameState` state — all tokens back to base rotation, all slots empty. Partial reset (keeping correct characters) is a UX enhancement noted in plan-models.md but not implemented in MVP. Confirm full reset is acceptable for now.

**G4 — WordSelectionStrategy lives in `src/lib/word/types.ts`**
Moved from `src/state/types.ts` (where plan-models.md placed it). It is a word-selection concept used by game setup, not a state-shape concept. `DevSettings` (app-layer) holds a `WordSelectionStrategy` value.
