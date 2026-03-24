# plan-models.md
> Jamo Word Game — Data Types, Interfaces, and State Shape
> Status: draft — awaiting review

This document is the single source of truth for every type in the codebase. Implementation must not define types that are not here, and must not deviate from the shapes defined here without updating this document first.

All types are TypeScript. All jamo strings use **Hangul Compatibility Jamo codepoints (U+3130–U+318F)** unless explicitly noted otherwise.

---

## Table of Contents

1. [Jamo Domain](#1-jamo-domain)
2. [Puzzle Domain](#2-puzzle-domain)
3. [Engine Domain](#3-engine-domain)
4. [Composer Domain](#4-composer-domain)
5. [Game State](#5-game-state)
6. [Game Actions](#6-game-actions)
7. [Derived / Computed Types](#7-derived--computed-types)
8. [Persistence Types](#8-persistence-types)
9. [Dev Settings](#9-dev-settings)
10. [Type Dependency Graph](#10-type-dependency-graph)

---

## 1. Jamo Domain

**File**: `src/lib/jamo/jamo-data.ts`

### `JamoType`

```typescript
type JamoType = 'consonant' | 'vowel'
```

### `JamoEntry`

Describes a single jamo. This is the shape of each entry in the master jamo registry.

```typescript
type JamoEntry = {
  jamo: string          // the character, e.g. 'ㄱ' (U+3131)
  romanization: string  // e.g. 'giyeok'
  type: JamoType
  canBeChoseong: boolean
  canBeJungseong: boolean
  canBeJongseong: boolean
}
```

Note: `canBeChoseong` is false for all vowels. `canBeJungseong` is false for all consonants. `canBeJongseong` is false for all vowels and for consonants that cannot appear as a final consonant (ㄸ, ㅃ, ㅉ cannot appear as jongseong in standard Korean).

### `RotationSet`

A set of jamo that are interchangeable by rotation. Any member can become any other member.

```typescript
// src/lib/jamo/jamo-data.ts
export const ROTATION_SETS: readonly (readonly string[])[] = [
  ['ㄱ', 'ㄴ'],
  ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ'],
  ['ㅣ', 'ㅡ'],
  ['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ'],
]
```

### `CombinationRule`

Describes how two jamo combine into one. Used to generate the lookup table.

```typescript
type CombinationRule = {
  inputs: [string, string]  // ordered pair — order matters (ㅗ+ㅏ ≠ ㅏ+ㅗ)
  output: string
  kind: 'doubleConsonant' | 'complexVowel' | 'compoundBatchim'
}
```

The full combination table is a `readonly CombinationRule[]` exported as `COMBINATION_RULES` from `jamo-data.ts`. It is the canonical source — do not duplicate this data elsewhere.

### `ChoseongIndexTable` / `JongseongIndexTable`

These are `Record<string, number>` maps from compatibility jamo to the Unicode syllable index for that position. They are **different tables** — the same jamo has a different index as choseong vs jongseong.

```typescript
// exported from jamo-data.ts
export const CHOSEONG_INDEX: Record<string, number>
export const JUNGSEONG_INDEX: Record<string, number>
export const JONGSEONG_INDEX: Record<string, number>  // 0 = no jongseong
```

`JONGSEONG_INDEX['']` must equal `0` (no final consonant).

---

## 2. Puzzle Domain

**File**: `src/lib/puzzle/types.ts`

### `JamoPool`

The available jamo for a puzzle, represented as a frequency map. Keys are compatibility jamo strings. Values are non-negative integers.

```typescript
type JamoPool = Record<string, number>

// Example:
// { 'ㄱ': 3, 'ㅏ': 3, 'ㅎ': 1, 'ㅇ': 1 }
```

**Invariants**:
- All keys are valid basic jamo (no complex vowels, no double consonants, no compound batchim — those are always derived)
- All values are ≥ 1 (zero-count entries must be removed)

### `Puzzle`

```typescript
type Puzzle = {
  id: string            // unique stable identifier, e.g. 'puzzle-042'
  word: string          // target word as a sequence of syllable block codepoints, e.g. '한국어'
  pool: JamoPool        // available jamo — resets fully after each guess
  wordLength: number    // character count — must equal [...word].length (spread for Unicode safety)
}
```

Note: `difficulty` is not stored on `Puzzle`. It is derived in the UI layer as:
```typescript
function getDifficultyLabel(wordLength: number): 'easy' | 'medium' | 'hard' | 'expert' {
  if (wordLength === 3) return 'easy'
  if (wordLength === 4) return 'medium'
  if (wordLength === 5) return 'hard'
  return 'expert'  // extensible
}
```

### `PuzzlesData`

Shape of `public/data/puzzles.json`.

```typescript
type PuzzlesData = {
  version: string     // semver string for the data format, e.g. '1.0.0'
  puzzles: Puzzle[]
}
```

### `PuzzleSelectionStrategy`

```typescript
type PuzzleSelectionStrategy =
  | { kind: 'daily' }                   // select by date seed (production default)
  | { kind: 'random' }                  // select randomly (dev)
  | { kind: 'byId'; id: string }        // select specific puzzle (dev)
  | { kind: 'byDate'; date: string }    // ISO date string 'YYYY-MM-DD' (dev)
```

---

## 3. Engine Domain

**File**: `src/lib/engine/`

### `TileResult`

```typescript
type TileResult = 'green' | 'yellow' | 'gray'
```

- `green`: character is in the word at this exact position
- `yellow`: character is in the word but at a different position
- `gray`: character does not appear in the word at all

### `GuessEvaluation`

```typescript
type GuessEvaluation = {
  results: TileResult[]   // one per character in the guess, same length as guess
}
```

### `ValidationResult`

```typescript
type ValidationResult =
  | { valid: true }
  | { valid: false; reason: ValidationFailureReason }

type ValidationFailureReason =
  | 'WRONG_LENGTH'              // guess has wrong number of characters for this puzzle
  | 'INSUFFICIENT_JAMO'         // guess requires more of a jamo than the pool contains
  | 'INVALID_JAMO_COMBINATION'  // a derived jamo used cannot be produced from pool jamo
  | 'INVALID_SYLLABLE'          // a character is not a valid Korean syllable block
```

### `ScoringResult`

```typescript
type ScoringResult = {
  guessCount: number
  // extensible — future: par score, streak bonus, etc.
}
```

---

## 4. Composer Domain

These types model the ephemeral state of the player assembling a single guess. They live in `src/state/types.ts` (they are state-layer types, not domain-layer types).

### `ComposerSlotContent`

Tracks what is currently occupying one slot of the syllable being built, and which pool jamo were consumed to produce it.

```typescript
type ComposerSlotContent = {
  resolved: string      // the current jamo in this slot after rotation/combination
                        // e.g. 'ㅐ' if player combined ㅏ + ㅣ
  consumed: string[]    // pool jamo spent to produce `resolved`
                        // e.g. ['ㅏ', 'ㅣ'] for ㅐ
                        // e.g. ['ㄱ', 'ㅅ'] for compound batchim ㄳ
                        // e.g. ['ㄱ'] for a plain non-rotated ㄱ
                        // e.g. ['ㄴ'] for a ㄱ rotated to ㄴ (ㄴ is the consumed token from the pool perspective — wait, see note below)
}
```

> **Important**: `consumed` tracks what was drawn from the **pool** (which contains only basic jamo). A rotated jamo means the base jamo was consumed and transformed. For example, if the player takes ㄱ from the pool and rotates it to ㄴ, `consumed` is `['ㄱ']` and `resolved` is `'ㄴ'`. This is because the pool holds `ㄱ`, not `ㄴ`.

### `ComposerState`

```typescript
type ComposerState = {
  choseong: ComposerSlotContent | null
  jungseong: ComposerSlotContent | null
  jongseong: ComposerSlotContent | null
}
```

A `ComposerState` is "complete" (ready to finalize into a syllable) when:
- `choseong !== null`
- `jungseong !== null`
- `jongseong` may be null (no final consonant is valid)

### `CommittedCharacter`

A syllable that has been finalized within the current guess draft (before the guess is submitted).

```typescript
type CommittedCharacter = {
  syllable: string      // the composed syllable block, e.g. '한'
  consumed: string[]    // flat list of all pool jamo spent on this character
}
```

### `DraftState`

The full ephemeral state of the guess currently being constructed.

```typescript
type DraftState = {
  characters: CommittedCharacter[]   // syllables finalized so far in this guess
  composer: ComposerState            // the syllable currently being built
}
```

**Derived from DraftState** (not stored, computed on read):

```typescript
// All pool jamo currently consumed by the draft
function getDraftConsumed(draft: DraftState): string[] {
  const fromCommitted = draft.characters.flatMap(c => c.consumed)
  const fromComposer = [
    ...(draft.composer.choseong?.consumed ?? []),
    ...(draft.composer.jungseong?.consumed ?? []),
    ...(draft.composer.jongseong?.consumed ?? []),
  ]
  return [...fromCommitted, ...fromComposer]
}

// Remaining pool availability given current draft
function getRemainingPool(pool: JamoPool, draft: DraftState): JamoPool
```

---

## 5. Game State

**File**: `src/state/types.ts`

### `GameStatus`

```typescript
type GameStatus =
  | 'idle'      // no puzzle loaded yet
  | 'playing'   // puzzle active, player is guessing
  | 'won'       // player guessed correctly
```

No `'lost'` status in MVP (no hard guess limit).

### `GuessRecord`

A completed, evaluated guess stored in history.

```typescript
type GuessRecord = {
  characters: string[]          // the submitted syllable strings, e.g. ['한', '국', '어']
  evaluation: TileResult[]      // per-character result, same length as characters
}
```

### `GameState`

```typescript
type GameState = {
  status: GameStatus
  puzzle: Puzzle | null           // null when status is 'idle'
  guesses: GuessRecord[]          // history of all submitted guesses, oldest first
  draft: DraftState               // current in-progress guess
  devSettings: DevSettings        // see section 9
}
```

**Invariants**:
- When `status === 'idle'`: `puzzle` is null, `guesses` is empty, `draft` is empty
- When `status === 'playing'` or `'won'`: `puzzle` is non-null
- `guesses.length` represents the number of completed attempts
- `draft` is always reset to empty after a successful `SUBMIT_GUESS`
- `draft.characters.length` must never exceed `puzzle.wordLength`

### `INITIAL_STATE`

```typescript
export const INITIAL_STATE: GameState = {
  status: 'idle',
  puzzle: null,
  guesses: [],
  draft: {
    characters: [],
    composer: {
      choseong: null,
      jungseong: null,
      jongseong: null,
    },
  },
  devSettings: {
    enabled: false,
    strategy: { kind: 'daily' },
  },
}
```

---

## 6. Game Actions

**File**: `src/state/types.ts`

Every action is a member of the `GameAction` discriminated union. The reducer switches on `action.type`.

```typescript
type GameAction =
  | StartGameAction
  | SetComposerSlotAction
  | RotateSlotJamoAction
  | CombineSlotJamoAction
  | ClearComposerSlotAction
  | CommitCharacterAction
  | RemoveCommittedCharacterAction
  | SubmitGuessAction
  | ClearDraftAction
  | ResetGameAction
  | SetDevSettingsAction
```

### Action Definitions

```typescript
// Load a puzzle and transition to 'playing'
type StartGameAction = {
  type: 'START_GAME'
  payload: { puzzle: Puzzle }
}

// Place a jamo from the pool into a composer slot
// `consumed` is the pool jamo drawn; `resolved` is what it becomes after rotation
type SetComposerSlotAction = {
  type: 'SET_COMPOSER_SLOT'
  payload: {
    slot: 'choseong' | 'jungseong' | 'jongseong'
    content: ComposerSlotContent
  }
}

// Rotate the jamo currently in a slot to the next member of its rotation set
type RotateSlotJamoAction = {
  type: 'ROTATE_SLOT_JAMO'
  payload: {
    slot: 'choseong' | 'jungseong' | 'jongseong'
    targetJamo: string    // the specific rotation target chosen
  }
}

// Combine a jamo from the pool with the jamo currently in a slot
// e.g. combine ㅣ into a slot already holding ㅏ → slot becomes ㅐ
type CombineSlotJamoAction = {
  type: 'COMBINE_SLOT_JAMO'
  payload: {
    slot: 'choseong' | 'jungseong' | 'jongseong'
    additionalJamo: string    // the pool jamo being added to the slot
  }
}

// Clear one slot of the composer, returning consumed jamo to available display
type ClearComposerSlotAction = {
  type: 'CLEAR_COMPOSER_SLOT'
  payload: { slot: 'choseong' | 'jungseong' | 'jongseong' }
}

// Finalize the current composer state into a CommittedCharacter
// Precondition: composer has at minimum choseong + jungseong filled
type CommitCharacterAction = {
  type: 'COMMIT_CHARACTER'
  // no payload — reads from current draft.composer
}

// Remove the last committed character from draft.characters
// Returns it to "in composer" state for editing
type RemoveCommittedCharacterAction = {
  type: 'REMOVE_COMMITTED_CHARACTER'
}

// Validate and submit the current draft as a guess
// Precondition: draft.characters.length === puzzle.wordLength
type SubmitGuessAction = {
  type: 'SUBMIT_GUESS'
  payload: { evaluation: GuessEvaluation }
  // evaluation is computed by the engine before dispatching;
  // the reducer only records it — it does not compute it
}

// Clear the entire draft without submitting
type ClearDraftAction = {
  type: 'CLEAR_DRAFT'
}

// Reset to INITIAL_STATE
type ResetGameAction = {
  type: 'RESET_GAME'
}

// Update dev settings
type SetDevSettingsAction = {
  type: 'SET_DEV_SETTINGS'
  payload: Partial<DevSettings>
}
```

> **Agent note**: `SUBMIT_GUESS` receives a pre-computed `GuessEvaluation` in its payload. The UI layer calls `evaluateGuess()` from `src/lib/engine/evaluate.ts` *before* dispatching this action. The reducer is not responsible for evaluation — it only appends the `GuessRecord` to state. This keeps the reducer pure and side-effect free.

---

## 7. Derived / Computed Types

These are not stored in state. They are computed by selector functions or inline in components.

### `RackJamoStatus`

What the Rack component needs to render each jamo token.

```typescript
type RackJamoStatus = {
  jamo: string            // the base pool jamo (e.g. 'ㄱ')
  total: number           // total count in pool
  available: number       // remaining after draft consumption (total - in-use count)
  rotationOptions: string[] // what this jamo can rotate to
}
```

Computed from `puzzle.pool` and `getDraftConsumed(draft)`.

### `ComposerReadyState`

Whether the current composer state can be committed.

```typescript
type ComposerReadyState =
  | { ready: true; preview: string }      // preview is the syllable that would be committed
  | { ready: false; reason: string }
```

### `GuessReadyState`

Whether the current draft can be submitted.

```typescript
type GuessReadyState =
  | { ready: true }
  | { ready: false; reason: string }
```

---

## 8. Persistence Types

Stored in `localStorage`. Not part of `GameState` — loaded and saved separately.

```typescript
// key: 'jamo-game-score-history'
type ScoreRecord = {
  puzzleId: string
  guessCount: number
  completedAt: string   // ISO 8601 datetime
}

type ScoreHistory = ScoreRecord[]
```

MVP note: score history is recorded but no stats UI exists yet. The type is defined now so storage format is stable.

---

## 9. Dev Settings

**File**: `src/state/types.ts`

```typescript
type DevSettings = {
  enabled: boolean
  strategy: PuzzleSelectionStrategy
}
```

`enabled` gates the dev UI entirely — when false, no dev controls are rendered and strategy is always `{ kind: 'daily' }`. Dev settings are never persisted to localStorage.

---

## 10. Type Dependency Graph

```
JamoEntry, RotationSet, CombinationRule, CHOSEONG_INDEX,
JUNGSEONG_INDEX, JONGSEONG_INDEX
  ↓ used by
  src/lib/jamo/rotation.ts → getRotationOptions(jamo): string[]
  src/lib/jamo/composition.ts → combineJamo(), composeSyllable(), decomposeSyllable()
  ↓ used by
  src/lib/engine/validate.ts → isGuessValid(): ValidationResult
  src/lib/engine/evaluate.ts → evaluateGuess(): GuessEvaluation
  src/lib/engine/scoring.ts  → calculateScore(): ScoringResult

Puzzle, JamoPool, PuzzleSelectionStrategy, PuzzlesData
  ↓ used by
  src/lib/puzzle/loader.ts   → loadPuzzles(), selectPuzzle()
  ↓ used by
  src/state/gameReducer.ts   → START_GAME action

ComposerSlotContent, ComposerState, CommittedCharacter, DraftState
  ↓ compose into
  GameState
  ↓ managed by
  src/state/gameReducer.ts   (GameAction → GameState)
  ↓ provided via
  src/state/GameContext.tsx  → useGame()
  ↓ consumed by
  src/components/Rack/       → RackJamoStatus (derived)
  src/components/Composer/   → ComposerReadyState (derived)
  src/components/Board/      → GuessRecord[]
  src/components/modals/     → ScoringResult (derived)
```

---

## ⚑ Assumptions — Review Before Proceeding

**M1 — `consumed` tracks pool jamo, not resolved jamo**

`ComposerSlotContent.consumed` records which basic pool jamo were spent, not what they resolved to. A ㄱ rotated to ㄴ has `consumed: ['ㄱ']`, `resolved: 'ㄴ'`. This means pool availability display subtracts `consumed` from the pool directly. Confirm this is the intended model, particularly for the case where a player rotates a jamo — do they "spend" the base jamo from the pool, or the resolved jamo?

**M2 — `SUBMIT_GUESS` receives pre-computed evaluation**

The reducer does not call `evaluateGuess()`. The UI calls it before dispatching. This is architecturally clean (pure reducer) but means the UI layer must handle the async gap — there should be no state between "submit pressed" and "evaluation dispatched" that the user can observe as a flicker. Confirm this flow is acceptable or whether evaluation should happen inside the reducer (which would require passing `evaluateGuess` as a dependency — awkward).

**M3 — No `'lost'` game status**

Per A7: no hard guess limit in MVP. `GameStatus` has no `'lost'` variant. If this is added later, `GuessRecord[]` already has everything needed — just add the status and a max-guesses constant. Confirm MVP scope is correct.

**M4 — `REMOVE_COMMITTED_CHARACTER` only removes the last character**

The action removes the most recently committed character and restores it to the composer for editing. It does not support removing an arbitrary character by index. If the player wants to edit the first character of a three-character guess, they must remove the third, then the second, then the first. Confirm this is acceptable UX for MVP.

**M5 — Dev settings not persisted**

Dev settings reset to `{ enabled: false, strategy: { kind: 'daily' } }` on every page load. If you want the last-used dev strategy to survive refreshes, this needs a `localStorage` read in the initial state. Flagging since it would affect the developer's daily workflow.

