# plan-models.md
> Jamo Word Game — Data Types, Interfaces, and State Shape
> Status: draft — awaiting review

This document is the single source of truth for every type in the codebase. All types are TypeScript. All jamo strings use **Hangul Compatibility Jamo codepoints (U+3130–U+318F)** unless explicitly noted otherwise.

---

## 1. Jamo Primitives

A jamo is a plain `string` — one Unicode compatibility jamo character. No wrapper type.

### Rotation

```typescript
// src/lib/jamo/jamo-data.ts

// Source of truth for rotation rules — edit here only
export const ROTATION_SETS: readonly (readonly string[])[] = [
  ['ㄱ', 'ㄴ'],
  ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ'],
  ['ㅣ', 'ㅡ'],
  ['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ'],
]

// Derived from ROTATION_SETS at module load — used for all runtime lookups
export const ROTATION_MAP: ReadonlyMap<string, readonly string[]>
```

```typescript
// src/lib/jamo/rotation.ts

// All jamo this one can become (excluding itself), or [] if not rotatable
export function getRotationOptions(jamo: string): readonly string[]

// The next jamo when cycling clockwise through the rotation set (wraps around)
// Returns null if the jamo is not rotatable
export function getNextRotation(jamo: string): string | null
```

### Combination

Combination is **commutative** — argument order does not matter.

```typescript
// src/lib/jamo/jamo-data.ts

type CombinationRule = {
  inputs: readonly [string, string]  // canonical unordered pair
  output: string
  kind: 'doubleConsonant' | 'complexVowel' | 'compoundBatchim'
}

export const COMBINATION_RULES: readonly CombinationRule[]
```

```typescript
// src/lib/jamo/composition.ts

// Returns the combined jamo if a rule exists for this pair, or null
// Order of arguments does not matter: combineJamo('ㅗ','ㅏ') === combineJamo('ㅏ','ㅗ')
export function combineJamo(a: string, b: string): string | null
```

### Syllable Block Composition

A Korean syllable block is built from choseong (initial consonant) + jungseong (vowel) + optional jongseong (final consonant). The Unicode standard assigns each jamo a position-specific integer index. **The same jamo has a different index value depending on its position** — this is fixed by the Unicode standard, not the application.

```typescript
// src/lib/jamo/jamo-data.ts

// Each maps a compatibility jamo string to its Unicode position ordinal
export const CHOSEONG_INDEX:  Readonly<Record<string, number>>
export const JUNGSEONG_INDEX: Readonly<Record<string, number>>
export const JONGSEONG_INDEX: Readonly<Record<string, number>>
// JONGSEONG_INDEX[''] === 0  (no final consonant)
```

```typescript
// src/lib/jamo/composition.ts

// Composes three parts into a syllable block codepoint string
// Returns null if inputs are not valid for their respective positions
export function composeSyllable(
  choseong: string,
  jungseong: string,
  jongseong?: string,
): string | null

// Decomposes a syllable block back into its parts
// Returns null if the input is not in the syllable block range U+AC00–U+D7A3
export function decomposeSyllable(
  syllable: string,
): { choseong: string; jungseong: string; jongseong: string | null } | null
```

---

## 2. Character (글자)

`Character` is the central abstraction. A character is an **ordered list of jamo** representing the current state of what the player is building. It may be complete (a valid syllable block) or incomplete (an intermediate or partial form).

```typescript
// src/lib/character/types.ts

type Character = {
  jamo: readonly string[]
}
```

### `resolveCharacter`

This is the core function of the model. It takes the raw jamo list and reduces it to its simplest resolved form by applying combination rules first, then syllable composition.

```typescript
// src/lib/character/character.ts

// Reduces a character's jamo list to its resolved form.
// Returns the resolved string, or null if the jamo cannot be meaningfully reduced.
export function resolveCharacter(character: Character): string | null
```

**How resolution works, step by step:**

If the jamo list has two entries and a combination rule exists for them, the result is the combined jamo:
- `['ㅏ', 'ㅣ']` → `combineJamo('ㅏ','ㅣ')` → `'ㅐ'`
- `['ㄱ', 'ㄱ']` → `combineJamo('ㄱ','ㄱ')` → `'ㄲ'`

If the list contains a consonant followed by a vowel (with optional second consonant), syllable composition is attempted:
- `['ㅎ', 'ㅐ']` → `composeSyllable('ㅎ','ㅐ')` → `'해'`
- `['ㄱ', 'ㅏ', 'ㄱ']` → `composeSyllable('ㄱ','ㅏ','ㄱ')` → `'각'`
- `['ㅎ', 'ㅏ', 'ㄴ']` → `composeSyllable('ㅎ','ㅏ','ㄴ')` → `'한'`

If the list is a single jamo with no further reduction possible, it returns that jamo as-is:
- `['ㄱ']` → `'ㄱ'`
- `['ㅐ']` → `'ㅐ'`  (already a combined vowel — resolves to itself)

If the jamo cannot be reduced (e.g. two consonants with no combination rule), returns `null`:
- `['ㄱ', 'ㅎ']` → `null` (no combination rule, cannot compose a syllable)

### `isComplete`

```typescript
// Returns true if resolveCharacter produces a valid Korean syllable block (U+AC00–U+D7A3)
export function isComplete(character: Character): boolean
```

A complete character is one that resolves to a syllable block — not a bare jamo, not an intermediate combined jamo, not null. `'해'` is complete; `'ㅐ'` is not.

---

## 3. Word

A `Word` is a branded string — the target the player is guessing. Everything else is derived from it.

```typescript
// src/lib/word/types.ts

type Word = string & { readonly _brand: 'Word' }

function createWord(s: string): Word {
  // validate that s is a non-empty string of Korean syllable blocks
  return s as Word
}
```

Derived properties — computed, never stored:

```typescript
// The individual syllable block characters, e.g. [...'한국어'] → ['한','국','어']
const chars: string[] = [...word]

// The number of characters (Unicode-safe)
const length: number = [...word].length
```

The word string is its own natural identifier — no separate `id` field.

The jamo pool for a word is derived in two steps:

```typescript
// Step 1 — decompose every character of the word into its constituent jamo,
// leaving them in their natural (possibly rotated) form.
// e.g. '한국어' → ['ㅎ', 'ㄴ', 'ㄱ', 'ㅜ', 'ㄱ', 'ㅇ', 'ㅓ']
export function derivePool(word: Word): readonly string[]

// Step 2 — rotate each jamo to the 0-index member of its rotation set.
// This normalizes the pool to a clean slate that does not reveal
// information about the target word.
// e.g. ['ㄴ'] → ['ㄱ'] (ㄴ is index 1 in ['ㄱ','ㄴ'], so it becomes ㄱ)
//      ['ㅓ'] → ['ㅏ'] (ㅓ is index 1 in ['ㅏ','ㅓ','ㅗ','ㅜ'], so it becomes ㅏ)
//      ['ㅎ'] → ['ㅎ'] (not rotatable — unchanged)
export function normalizePool(jamo: readonly string[]): readonly string[]
```

Game initialization calls both in sequence: `normalizePool(derivePool(word))`. `derivePool` is also useful independently for decomposing arbitrary words or characters outside of game initialization.

---

## 4. Pool State

The pool is the collection of jamo tokens available to the player each round. Each token starts as a single-jamo `Character` and may be transformed through rotation and combination during play.

```typescript
// src/state/types.ts

type PoolToken = {
  id: number          // stable index into the original pool array — never changes
  character: Character
}

type PoolState = readonly PoolToken[]
```

`id` is the token's stable identity across state updates. It is used by the reducer to locate a specific token and by the UI to key rendered elements. It does not encode position or ordering — it is just a unique number.

The initial pool is constructed once per word and reconstructed on reset:

```typescript
// Constructs a fresh pool from a word — one single-jamo token per pool entry
export function createInitialPool(word: Word): PoolState
```

After submission, reset is **composable** — the application decides which tokens to restore and which to keep in place. A full reset calls `createInitialPool`. A partial reset (e.g. keeping correct characters in their submission slots) is built from that same function plus selective restoration logic determined later.

---

## 5. Submission State

The submission area holds one slot per character in the target word.

```typescript
// src/state/types.ts

type SubmissionSlot =
  | { filled: true;  tokenId: number; character: Character }
  | { filled: false }

type SubmissionState = readonly SubmissionSlot[]  // length always equals [...word].length
```

**Rules:**
- A slot may be filled with a complete **or** incomplete character — whether incomplete characters may be placed in slots is a UX decision left open for now
- A guess may only be submitted when every filled slot contains a **complete** character (`isComplete` returns true)
- An empty slot is treated as `'absent'` in the evaluation
- The player does not need to fill every slot to submit — unfilled slots produce `'absent'` results

---

## 6. Guess Evaluation

### `CharacterResult`

Semantic names — colours are a UI decision.

```typescript
type CharacterResult =
  | 'correct'   // character is at the right position
  | 'present'   // character is in the word but at a different position
  | 'absent'    // character is not in the word (or slot was empty)
```

### `EvaluatedCharacter`

Character and result are always stored together — no parallel arrays.

```typescript
type EvaluatedCharacter = {
  character: string       // the resolved syllable string, or null for an empty slot
  result: CharacterResult
}
```

### `GuessRecord`

```typescript
type GuessRecord = readonly EvaluatedCharacter[]  // length === [...word].length
```

---

## 7. Game State

```typescript
// src/state/types.ts

type GameState = {
  word: Word
  pool: PoolState
  submission: SubmissionState
  guesses: readonly GuessRecord[]
}
```

**On `readonly` arrays:** `readonly GuessRecord[]` means the array cannot be mutated in place (no `.push()`). The reducer returns new state by spreading: `guesses: [...state.guesses, newRecord]`. This is standard reducer pattern and does not prevent the array from growing.

**`won` is derived, not stored:**

```typescript
function isWon(state: GameState): boolean {
  const last = state.guesses.at(-1)
  return last !== undefined && last.every(e => e.result === 'correct')
}
```

There is no `status` field and no `'idle'` state. The application layer controls whether a game is active by deciding whether to render the game component at all. The game component always assumes it has a valid `word`.

**Invariants:**
- `submission.length === [...state.word].length` at all times
- `pool` and `submission` are reset (fully or partially) after `SUBMIT_GUESS`
- `guesses` grows by one record per `SUBMIT_GUESS`

The initial state factory:

```typescript
export function createInitialGameState(word: Word): GameState {
  return {
    word,
    pool: createInitialPool(word),
    submission: Array.from({ length: [...word].length }, () => ({ filled: false })),
    guesses: [],
  }
}
```

---

## 8. Game Actions and the Reducer

`GameAction` is a discriminated union — every member has a `type` field with a unique string literal. TypeScript narrows the type inside each `switch` case so `action.payload` is always fully typed.

```typescript
// src/state/types.ts

type GameAction =
  | { type: 'ROTATE_TOKEN';     payload: { tokenId: number; targetJamo: string } }
  | { type: 'COMBINE_TOKENS';   payload: { tokenIdA: number; tokenIdB: number } }
  | { type: 'SPLIT_TOKEN';      payload: { tokenId: number } }
  | { type: 'PLACE_TOKEN';      payload: { tokenId: number; slotIndex: number } }
  | { type: 'REMOVE_FROM_SLOT'; payload: { slotIndex: number } }
  | { type: 'SUBMIT_GUESS';     payload: { evaluation: GuessRecord } }
  | { type: 'RESET_ROUND' }
```

### Action Semantics

**`ROTATE_TOKEN`** — changes the single jamo of a pool token to `targetJamo`. `targetJamo` must be a member of that jamo's rotation set. Only valid for single-jamo tokens (a multi-jamo character cannot be rotated as a whole).

**`COMBINE_TOKENS`** — attempts to combine token A and token B. The reducer calls `combineJamo` on the two characters' resolved jamo; if the result is null (no valid combination rule exists), the action is a no-op and state is returned unchanged. If valid, the combined jamo becomes A's new single-jamo character and token B is removed from the pool. Players cannot produce an invalid intermediate state — invalid combinations are rejected at the action level.

**`SPLIT_TOKEN`** — decomposes a multi-jamo token back into individual single-jamo tokens, one per jamo in the current character's list. Per M2: tokens are restored with their current jamo — no rollback to pre-rotation state. After splitting, all token ids in the pool are reassigned from scratch (0, 1, 2, … in order). No id counter is needed in state.

**`PLACE_TOKEN`** — moves a token from the pool into a submission slot. Removes the token from `pool`, sets `submission[slotIndex]` to filled with that token's current character. Whether incomplete characters may be placed is a UX decision — the action itself does not enforce completeness.

**`REMOVE_FROM_SLOT`** — returns a token from a submission slot back to the pool. Sets the slot to `{ filled: false }`.

**`SUBMIT_GUESS`** — receives a pre-computed `GuessRecord` in its payload (computed by the engine *before* dispatch), appends it to `guesses`, then resets pool and submission. The reducer does not compute evaluation — it only records it.

**`RESET_ROUND`** — resets pool and submission without appending to guesses. Used for clear/restart within the same word.

---

## 9. Dev Settings

Dev settings live in application state, not game state.

```typescript
// src/state/types.ts  (or src/app/types.ts — TBD at scaffold time)

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

```typescript
// localStorage key: 'jamo-game-score-history'

type ScoreRecord = {
  word: string          // the word string is the identifier
  guessCount: number
  completedAt: string   // ISO 8601 datetime
}

type ScoreHistory = ScoreRecord[]
```

A separate `UserSettings` key may be added later for preferences such as default difficulty. Not modelled yet.

---

## Resolved Assumptions

| # | Decision |
|---|---|
| M1 | `COMBINE_TOKENS` validates via `combineJamo` — invalid combinations are a no-op. Players cannot reach an unresolvable state. |
| M2 | Absent-by-omission and absent-by-wrong-character are the same result — both are `'absent'`. No fourth variant needed. |
| M3 | Pool derivation is two steps: `derivePool` decomposes the word into natural jamo; `normalizePool` rotates each to its 0-index rotation state. Run once at game init. `derivePool` remains useful standalone. |
| M4 | On `SPLIT_TOKEN`, all pool token ids are reassigned from scratch. No counter in state. |
