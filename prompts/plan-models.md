# plan-models.md
> Jamo Word Game — Data Types, Interfaces, and State Shape
> Status: draft — awaiting review

This document is the single source of truth for every type in the codebase. All types are TypeScript. All jamo strings use **Hangul Compatibility Jamo codepoints (U+3130–U+318F)** unless explicitly noted otherwise (see architecture.md for why).

---

## 1. Primitive: Jamo

A jamo is simply a `string` — one Unicode compatibility jamo character. No wrapper type needed.

### Rotation Lookup

Rotation sets are defined as an array of sets (for readability), then built into a `Map` for O(1) lookup:

```typescript
// src/lib/jamo/jamo-data.ts

// Source of truth — edit this to change rotation rules
export const ROTATION_SETS: readonly (readonly string[])[] = [
  ['ㄱ', 'ㄴ'],
  ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ'],
  ['ㅣ', 'ㅡ'],
  ['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ'],
]

// Derived at module load — do not edit directly
// Maps each jamo to the other members of its set
export const ROTATION_MAP: ReadonlyMap<string, readonly string[]>
```

`ROTATION_MAP` is built once from `ROTATION_SETS` at module initialisation. All runtime lookups use the map, never the array.

```typescript
// src/lib/jamo/rotation.ts

// Returns the other members of this jamo's rotation set, or [] if not rotatable
export function getRotationOptions(jamo: string): readonly string[]

// Returns the next jamo when cycling clockwise through the set (wraps around)
export function getNextRotation(jamo: string): string | null
```

### Combination Rules

Combination is **commutative** — order of inputs does not matter. `ㅗ+ㅏ` and `ㅏ+ㅗ` both produce `ㅘ`.

```typescript
// src/lib/jamo/jamo-data.ts

type CombinationRule = {
  inputs: readonly [string, string]   // canonical pair — stored in sorted order
  output: string
  kind: 'doubleConsonant' | 'complexVowel' | 'compoundBatchim'
}

export const COMBINATION_RULES: readonly CombinationRule[]
```

The lookup function handles commutativity internally:

```typescript
// src/lib/jamo/composition.ts

// Returns the combined jamo if the pair has a rule, or null
// Order of arguments does not matter
export function combineJamo(a: string, b: string): string | null
```

### Syllable Block Composition

Korean syllable blocks are built from three positions: choseong (initial consonant), jungseong (vowel), jongseong (optional final consonant). The Unicode formula requires a position-specific integer index for each jamo — not a codepoint, a table-defined ordinal. Critically, **the same jamo has different index values depending on position**. For example, ㄱ is index `0` as choseong and index `1` as jongseong. These tables are fixed by the Unicode standard.

```typescript
// src/lib/jamo/jamo-data.ts

// Maps compatibility jamo → its ordinal in the Unicode choseong sequence
export const CHOSEONG_INDEX: Readonly<Record<string, number>>

// Maps compatibility jamo → its ordinal in the Unicode jungseong sequence  
export const JUNGSEONG_INDEX: Readonly<Record<string, number>>

// Maps compatibility jamo → its ordinal in the Unicode jongseong sequence
// The empty string '' maps to 0 (no final consonant)
export const JONGSEONG_INDEX: Readonly<Record<string, number>>
```

```typescript
// src/lib/jamo/composition.ts

// Composes a syllable block codepoint from its parts
// Returns null if inputs are not valid for their positions
export function composeSyllable(
  choseong: string,
  jungseong: string,
  jongseong?: string
): string | null

// Decomposes a syllable block back into its parts
// Returns null if the input is not a valid syllable block (U+AC00–U+D7A3)
export function decomposeSyllable(
  syllable: string
): { choseong: string; jungseong: string; jongseong: string | null } | null
```

---

## 2. Core: Character (글자)

`Character` is the central abstraction. A character is an ordered list of jamo. It can be **complete** (forms a valid Korean syllable block) or **incomplete** (a partial or intermediate form the player is building toward).

```typescript
// src/lib/jamo/types.ts

type Character = {
  jamo: readonly string[]   // ordered list of component jamo
}
```

Completeness is **derived, not stored**:

```typescript
// src/lib/jamo/composition.ts

// Returns true if this character's jamo can be composed into a valid syllable block
export function isComplete(character: Character): boolean

// Returns the composed syllable string if complete, or null if incomplete
// e.g. ['ㅎ','ㅏ','ㄴ'] → '한', ['ㅏ','ㅣ'] → null (no choseong yet)
export function resolveCharacter(character: Character): string | null
```

**Examples of Character states:**

| `jamo` | `isComplete` | `resolveCharacter` | Notes |
|---|---|---|---|
| `['ㄱ']` | false | null | Single consonant, no vowel |
| `['ㄱ', 'ㅏ']` | true | `'가'` | Valid syllable |
| `['ㅎ', 'ㅏ', 'ㄴ']` | true | `'한'` | With jongseong |
| `['ㅏ', 'ㅣ']` | false | null | Combined vowel ㅐ, still no choseong |
| `['ㄱ', 'ㄱ']` | false | null | Two consonants — not yet a valid syllable but can combine to ㄲ |

The pool uses `Character` as its token type. Each token starts as a single-jamo Character and may grow through combination or change through rotation.

---

## 3. Word

A word is the target the player is guessing. It is the primary data entity of the game.

```typescript
// src/lib/word/types.ts

type Word = {
  value: string           // the target as a string of syllable blocks, e.g. '한국어'
  pool: readonly string[] // the initial jamo pool — an ordered list of base jamo strings
                          // e.g. ['ㅎ', 'ㄱ', 'ㄱ', 'ㄱ', 'ㅇ', 'ㅏ', 'ㅏ', 'ㅏ']
}
```

**Derived from Word (not stored):**

```typescript
// The characters of the word as an array — use spread for Unicode safety
// '한국어'.length === 3 but [...'한국어'].length === 3 — both work for syllable blocks,
// but spread is always correct for Korean text
const characters: string[] = [...word.value]
const wordLength: number = characters.length
```

`word.value` itself serves as the natural unique identifier — no separate `id` field needed.

The `pool` array defines **how many of each jamo exist**, not just which jamo. Duplicate entries represent multiple tokens of the same jamo. Order within the array is used to establish stable token identity (token at index 0, token at index 1, etc.).

---

## 4. Pool State

The pool is the player's working area. It starts as one `Character` token per entry in `word.pool`. The player rotates and combines tokens to build complete characters for submission.

```typescript
// src/state/types.ts

type PoolToken = {
  id: number              // stable index matching position in word.pool — never changes
  character: Character    // current state — starts as single-jamo, grows through play
  origin: string          // the original jamo from word.pool — needed for reset
}

type PoolState = readonly PoolToken[]
```

**Derived from PoolState:**

```typescript
// Returns a fresh pool reset to initial state from a word
function initialPool(word: Word): PoolState

// Which tokens are currently in submission slots (not available in pool)
function getSubmittedTokenIds(submission: SubmissionState): number[]

// Available tokens = all tokens minus those placed in submission
function getAvailableTokens(pool: PoolState, submission: SubmissionState): PoolToken[]
```

Pool resets fully to `initialPool(word)` after each guess is submitted.

---

## 5. Submission

The submission area holds the characters the player has placed for their current guess.

```typescript
// src/state/types.ts

// A slot in the submission row — either occupied by a token or empty
type SubmissionSlot =
  | { filled: true;  tokenId: number; character: Character }
  | { filled: false }

type SubmissionState = readonly SubmissionSlot[]  // length === [...word.value].length
```

A guess can only be submitted when every slot is filled with a **complete** character.

---

## 6. Guess Evaluation

### `CharacterResult`

Semantic names — not colors. Colors are a UI decision.

```typescript
type CharacterResult =
  | 'correct'   // character is in the word at this exact position
  | 'present'   // character is in the word but at a different position
  | 'absent'    // character does not appear in the word at all
```

### `EvaluatedCharacter`

The character and its result are tied together — never stored in separate parallel arrays.

```typescript
type EvaluatedCharacter = {
  character: string       // the syllable string, e.g. '한'
  result: CharacterResult
}
```

### `GuessRecord`

```typescript
type GuessRecord = readonly EvaluatedCharacter[]  // length === word length
```

---

## 7. Game State

```typescript
// src/state/types.ts

type GameState = {
  word: Word                    // the current target word (also acts as puzzle id)
  pool: PoolState               // current state of all jamo tokens
  submission: SubmissionState   // current guess being built
  guesses: readonly GuessRecord[] // history of submitted guesses, oldest first
  devSettings: DevSettings
}
```

`won` is derived, not stored:

```typescript
function isWon(state: GameState): boolean {
  const last = state.guesses.at(-1)
  return last !== undefined && last.every(e => e.result === 'correct')
}
```

There is no `'idle'` status. The application layer decides whether to render the game or an intro/loading screen by checking whether `word` is loaded. The game component assumes it always has a word.

**Invariants:**
- `submission.length === [...state.word.value].length` always
- `pool` and `submission` are reset to initial state after each `SUBMIT_GUESS`
- `guesses` grows by one record per `SUBMIT_GUESS`

### `INITIAL_GAME_STATE`

Cannot be a static constant — depends on the word. Constructed by:

```typescript
function createInitialGameState(word: Word, devSettings?: DevSettings): GameState
```

---

## 8. Game Actions and the Reducer

### What a discriminated union is

`GameAction` is a TypeScript **discriminated union** — a union type where every member has a `type` field with a unique string literal value. This lets TypeScript narrow which specific action you have inside a switch statement.

```typescript
type GameAction =
  | { type: 'ROTATE_TOKEN';     payload: { tokenId: number; targetJamo: string } }
  | { type: 'COMBINE_TOKENS';   payload: { tokenIdA: number; tokenIdB: number } }
  | { type: 'SPLIT_TOKEN';      payload: { tokenId: number } }
  | { type: 'PLACE_CHARACTER';  payload: { tokenId: number; slotIndex: number } }
  | { type: 'REMOVE_FROM_SLOT'; payload: { slotIndex: number } }
  | { type: 'SUBMIT_GUESS';     payload: { evaluation: GuessRecord } }
  | { type: 'RESET_ROUND' }
```

`useReducer` works like this:
```typescript
// In a component or hook:
dispatch({ type: 'ROTATE_TOKEN', payload: { tokenId: 2, targetJamo: 'ㄴ' } })

// In the reducer:
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ROTATE_TOKEN': {
      // TypeScript knows action.payload is { tokenId, targetJamo } here
      const { tokenId, targetJamo } = action.payload
      // ... return new state
    }
    case 'RESET_ROUND': {
      // TypeScript knows there is no action.payload here
      // ...
    }
  }
}
```

### Action semantics

**`ROTATE_TOKEN`** — changes the jamo of a single pool token to `targetJamo`. `targetJamo` must be a member of the token's current jamo's rotation set. Only valid for single-jamo tokens (a combined token cannot be rotated as a whole).

**`COMBINE_TOKENS`** — merges token B into token A. The new character is `combineJamo(A.jamo[0], B.jamo[0])` (or the appropriate combination). Token B is removed from the pool. Only valid if the two tokens can produce a valid combination.

**`SPLIT_TOKEN`** — decomposes a combined token back into its constituent jamo, each becoming a new single-jamo token. The original single tokens are restored (using `origin`).

**`PLACE_CHARACTER`** — moves a complete token from the pool into a submission slot. Token must be complete (`isComplete(token.character) === true`).

**`REMOVE_FROM_SLOT`** — returns a token from a submission slot back to the pool.

**`SUBMIT_GUESS`** — receives a pre-computed `GuessRecord` (computed by the engine before dispatching), appends it to `guesses`, then resets `pool` and `submission` to initial state.

**`RESET_ROUND`** — resets `pool` and `submission` without adding to `guesses`. Used for clear/restart within the same word.

> **Agent note**: `SUBMIT_GUESS` receives pre-computed evaluation in its payload. The UI calls `evaluateGuess()` from `src/lib/engine/evaluate.ts` *before* dispatching. The reducer only records the result. It does not compute it.

---

## 9. Dev Settings

```typescript
// src/state/types.ts

type WordSelectionStrategy =
  | { kind: 'daily' }
  | { kind: 'random' }
  | { kind: 'fixed'; word: string }
  | { kind: 'byDate'; date: string }    // ISO date 'YYYY-MM-DD'

type DevSettings = {
  enabled: boolean
  strategy: WordSelectionStrategy
}

const DEFAULT_DEV_SETTINGS: DevSettings = {
  enabled: false,
  strategy: { kind: 'daily' },
}
```

Dev settings are not persisted to `localStorage`.

---

## 10. Persistence

Stored in `localStorage`. Loaded and saved outside of `GameState`.

```typescript
// key: 'jamo-game-score-history'
type ScoreRecord = {
  word: string            // the word value serves as the puzzle identifier
  guessCount: number
  completedAt: string     // ISO 8601 datetime
}

type ScoreHistory = ScoreRecord[]
```

Other settings (e.g. default difficulty preference) may be added to a separate `UserSettings` key — extensible later.

---

## ⚑ Open Assumptions — Review Before Proceeding

**M1 — Pool token identity via array index**
Each token in the pool has a stable `id` matching its position in `word.pool`. This means if `word.pool` is `['ㄱ', 'ㄱ', 'ㄱ']`, there are three distinct tokens with ids 0, 1, 2, all initially holding `ㄱ`. The UI can display them as separate interactive tiles. Confirm this is the intended model, or specify an alternative identity scheme.

**M2 — SPLIT_TOKEN restores to original jamo**
When a combined token is split, the constituent tokens are restored using `origin` — the original pool jamo, not the jamo at the time of combination. This means a token that was rotated, then combined, then split goes back to its pre-rotation state. Confirm this is correct, or whether split should restore to the pre-combination state (which may have been rotated).

**M3 — COMBINE_TOKENS removes one token**
Combining tokens A and B removes B from the pool and mutates A. This means the pool shrinks by one token during a round. On `RESET_ROUND` or `SUBMIT_GUESS`, the full token list is restored. Confirm.

**M4 — Submission rejects incomplete characters**
`PLACE_CHARACTER` is only valid when `isComplete(token.character)` is true. An incomplete character (e.g. a combined vowel still missing a choseong) cannot be placed in a submission slot. Confirm.

**M5 — Word loading not modelled here**
How words are loaded (fetch from JSON, import, etc.) is left to `plan-word.md`. This document only models the shape of `Word`. Confirm this is the right boundary.
