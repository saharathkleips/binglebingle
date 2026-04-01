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

A single decomposition function that takes any jamo — basic, complex vowel, or compound batchim — and returns its basic constituents. Replaces the separate `expandJongseong` / `expandJungseong` functions from the earlier draft.

```typescript
import { COMBINATION_RULES, JONGSEONG_UPGRADE_RULES } from '../jamo/jamo-data'

// Decomposes a jamo into its basic constituents.
// - Basic jamo (ㄱ, ㅏ, etc.) return themselves: ['ㄱ']
// - Complex vowels decompose recursively via combination rules: 'ㅐ' → ['ㅏ','ㅣ']
// - Compound batchim decompose via jongseong upgrade rules: 'ㄳ' → ['ㄱ','ㅅ']
export function decomposeJamo(jamo: string): string[] {
  // Check compound batchim first (jongseong upgrade rules)
  const batchimRule = JONGSEONG_UPGRADE_RULES.find(r => r.output === jamo)
  if (batchimRule) return [batchimRule.existing, batchimRule.additional]

  // Check complex vowel (combination rules)
  const vowelRule = COMBINATION_RULES.find(r => r.output === jamo)
  if (vowelRule) {
    // Recurse: an input may itself be complex (e.g. ㅙ = ㅗ + ㅐ, ㅐ = ㅏ + ㅣ)
    return [...decomposeJamo(vowelRule.inputs[0]), ...decomposeJamo(vowelRule.inputs[1])]
  }

  // Basic jamo — return as-is
  return [jamo]
}
```

Recursion depth is bounded at 2 — no complex vowel or compound batchim requires more than two decomposition steps.

---

### Step 4 — `word.ts`: `derivePool`

Decomposes every syllable in the word into its basic jamo constituents. The result is an ordered flat array — one entry per basic jamo token, in reading order (choseong, then jungseong components, then jongseong components for each character).

```typescript
import { decomposeSyllable } from '../jamo/composition'

// Returns the basic jamo constituents of a word, in reading order.
// All complex vowels and compound batchim are fully decomposed to basic jamo.
// Jamo are in their natural (unmodified) form — not yet normalized.
// e.g. '해' → ['ㅎ','ㅏ','ㅣ']        (ㅐ decomposed)
// e.g. '훿' → ['ㅎ','ㅜ','ㅓ','ㅣ','ㄱ','ㅅ']  (ㅞ and ㄳ decomposed)
export function derivePool(word: Word): readonly string[] {
  return [...word].flatMap(syllable => {
    const parts = decomposeSyllable(syllable)
    if (parts === null) return []  // should not occur for a valid Word
    return [
      ...decomposeJamo(parts.choseong),
      ...decomposeJamo(parts.jungseong),
      ...(parts.jongseong !== null ? decomposeJamo(parts.jongseong) : []),
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

**`decomposeJamo`**
- `decomposeJamo('ㄱ')` → `['ㄱ']` (basic consonant)
- `decomposeJamo('ㅏ')` → `['ㅏ']` (basic vowel)
- `decomposeJamo('ㅐ')` → `['ㅏ','ㅣ']` (complex vowel)
- `decomposeJamo('ㅙ')` → `['ㅗ','ㅏ','ㅣ']` (multi-step complex vowel)
- `decomposeJamo('ㅞ')` → `['ㅜ','ㅓ','ㅣ']` (multi-step complex vowel)
- `decomposeJamo('ㄳ')` → `['ㄱ','ㅅ']` (compound batchim)
- `decomposeJamo('ㄺ')` → `['ㄹ','ㄱ']` (compound batchim)

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

## ⚑ Assumptions

**W1 — `decomposeJamo` always produces basic jamo**
The function assumes that no combination rule chains deeper than two levels. This holds for all current rules — ㅙ decomposes to ㅗ + ㅐ, and ㅐ decomposes to ㅏ + ㅣ, giving a max recursion depth of 2. If new combination rules are added that create deeper chains, this function will still handle them correctly due to the recursive implementation, but the depth bound should be re-verified.

**W2 — Pool jamo are always basic after `derivePool`**
The pool returned by `derivePool` contains only basic consonants and vowels — never complex vowels or compound batchim. This is the contract callers rely on. The test for '훿' verifies this for the most complex possible input.
