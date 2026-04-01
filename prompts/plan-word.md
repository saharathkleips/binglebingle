# plan-word.md
> Word Domain — Implementation Plan
> Depends on: plan-models.md, plan-jamo.md
> Status: draft — awaiting review

---

## What This Domain Does

Defines the `Word` branded type and the functions for decomposing a word into its constituent basic jamo — the starting pool. Nothing about loading, selection, or game setup lives here.

**Boundaries:**
- In: raw Korean word strings
- Out: validated `Word` values, ordered arrays of basic jamo
- Calls into: `src/lib/jamo/` for syllable decomposition and combination rule lookups
- No knowledge of: game state, pool tokens, loading, selection, UI, React

All exports are pure functions. No side effects.

---

## File Map

```
src/lib/word/
├── types.ts      # Word branded type
├── word.ts       # createWord(), derivePool(), normalizePool(), decomposeJamo()
└── word.test.ts
```

Game setup concerns (loading, word selection, daily index) live in `src/lib/game/` — see `plan-game.md`.

---

## Implementation Steps

### Step 1 — `types.ts`

```typescript
// A Word is a non-empty string of Korean syllable blocks (U+AC00–U+D7A3).
// The brand prevents plain strings from being passed where a validated Word is expected.
export type Word = string & { readonly _brand: 'Word' }
```

---

### Step 2 — `word.ts`: `createWord`

Validates and brands a raw string as a `Word`.

```typescript
export function createWord(s: string): Word | null {
  if (s.length === 0) return null
  const allSyllables = [...s].every(ch => {
    const cp = ch.codePointAt(0)
    return cp !== undefined && cp >= 0xAC00 && cp <= 0xD7A3
  })
  return allSyllables ? (s as Word) : null
}
```

---

### Step 3 — `word.ts`: `decomposeJamo`

Decomposes a jamo by **one step** into its immediate constituents. This mirrors the player action: breaking a combination returns the two jamo it was made from, not all the way to atomic parts. The player can break again if they want to go further.

```typescript
import { COMBINATION_RULES, JONGSEONG_UPGRADE_RULES } from '../jamo/jamo-data'

// Decomposes a jamo into its immediate constituents (one step only).
// Returns a two-element array if a decomposition rule exists, or [jamo] if it is already basic.
// e.g. 'ㅐ' → ['ㅏ','ㅣ']
// e.g. 'ㅙ' → ['ㅗ','ㅐ']   (not ['ㅗ','ㅏ','ㅣ'] — that requires a second call)
// e.g. 'ㄳ' → ['ㄱ','ㅅ']
// e.g. 'ㄱ' → ['ㄱ']        (basic — no rule)
export function decomposeJamo(jamo: string): string[] {
  const batchimRule = JONGSEONG_UPGRADE_RULES.find(r => r.output === jamo)
  if (batchimRule) return [batchimRule.existing, batchimRule.additional]

  const vowelRule = COMBINATION_RULES.find(r => r.output === jamo)
  if (vowelRule) return [vowelRule.inputs[0], vowelRule.inputs[1]]

  return [jamo]
}
```

---

### Step 4 — `word.ts`: `derivePool`

Fully decomposes every syllable in the word to basic jamo. Unlike `decomposeJamo`, this must reach the atomic level — no complex vowels, double consonants, or compound batchim in the output. It does this by repeatedly applying `decomposeJamo` on each jamo until nothing further decomposes (i.e. `decomposeJamo` returns a single-element array containing the jamo itself).

```typescript
import { decomposeSyllable } from '../jamo/composition'

// Fully decomposes a single jamo to its basic constituents by iterating decomposeJamo
// until stable. e.g. 'ㅙ' → one step gives ['ㅗ','ㅐ'], second gives ['ㅗ','ㅏ','ㅣ']
function toBasicJamo(jamo: string): string[] {
  let current = [jamo]
  while (true) {
    const next = current.flatMap(j => decomposeJamo(j))
    if (next.length === current.length && next.every((j, i) => j === current[i])) return current
    current = next
  }
}

// Returns the fully decomposed basic jamo constituents of a word, in reading order.
// e.g. '해' → ['ㅎ','ㅏ','ㅣ']
// e.g. '훿' → ['ㅎ','ㅜ','ㅓ','ㅣ','ㄱ','ㅅ']
export function derivePool(word: Word): readonly string[] {
  return [...word].flatMap(syllable => {
    const parts = decomposeSyllable(syllable)
    if (parts === null) return []
    return [
      ...toBasicJamo(parts.choseong),
      ...toBasicJamo(parts.jungseong),
      ...(parts.jongseong !== null ? toBasicJamo(parts.jongseong) : []),
    ]
  })
}
```

---

### Step 5 — `word.ts`: `normalizePool`

Rotates each jamo to the 0-index member of its rotation set. Jamo not in any rotation set are returned unchanged. Called once after `derivePool` at game initialisation to prevent the starting pool from revealing which jamo in the target word are rotated.

```typescript
import { ROTATION_SETS } from '../jamo/jamo-data'

function toBaseRotation(jamo: string): string {
  const set = ROTATION_SETS.find(s => s.includes(jamo))
  return set ? set[0] : jamo
}

// e.g. ['ㄴ','ㅓ','ㅠ','ㅡ'] → ['ㄱ','ㅏ','ㅑ','ㅣ']
export function normalizePool(jamo: readonly string[]): readonly string[] {
  return jamo.map(toBaseRotation)
}
```

**Full pipeline at game init:**
```typescript
const poolJamo = normalizePool(derivePool(word))
// poolJamo is the ordered list of basic, base-rotation jamo used to create PoolState
```

---

## Test Coverage Required

### `word.test.ts`

**`createWord`**
- `createWord('한국어')` returns a non-null `Word`
- `createWord('')` returns `null`
- `createWord('hello')` returns `null`
- `createWord('한a')` returns `null`

**`decomposeJamo`** (one step only)
- `decomposeJamo('ㄱ')` → `['ㄱ']` (basic — no rule)
- `decomposeJamo('ㅏ')` → `['ㅏ']` (basic — no rule)
- `decomposeJamo('ㅐ')` → `['ㅏ','ㅣ']`
- `decomposeJamo('ㅙ')` → `['ㅗ','ㅐ']` (one step — not `['ㅗ','ㅏ','ㅣ']`)
- `decomposeJamo('ㅞ')` → `['ㅜ','ㅔ']` (one step)
- `decomposeJamo('ㄳ')` → `['ㄱ','ㅅ']`
- `decomposeJamo('ㄺ')` → `['ㄹ','ㄱ']`

**`derivePool`**
- `derivePool(가)` → `['ㄱ','ㅏ']`
- `derivePool(한)` → `['ㅎ','ㅏ','ㄴ']`
- `derivePool(해)` → `['ㅎ','ㅏ','ㅣ']` (ㅐ decomposed)
- `derivePool(훿)` → `['ㅎ','ㅜ','ㅓ','ㅣ','ㄱ','ㅅ']` (ㅞ and ㄳ both decomposed)
- Multi-character: `derivePool(한국어)` produces jamo in reading order

**`normalizePool`**
- `normalizePool(['ㄴ','ㅓ','ㅠ','ㅡ'])` → `['ㄱ','ㅏ','ㅑ','ㅣ']`
- `normalizePool(['ㅎ','ㄷ'])` → `['ㅎ','ㄷ']` (not rotatable — unchanged)
- `normalizePool(derivePool(한국어))` contains only base-rotation jamo (no ㄴ, ㅓ, ㅜ)

---

## Resolved Assumptions

| # | Decision |
|---|---|
| W1 | `decomposeJamo` is one step — returns immediate constituents. `toBasicJamo` iterates until stable with no depth limit. No depth bound to verify. |
| W2 | `derivePool` always produces only basic jamo. The 훿 test case verifies this for the most complex possible input. |
