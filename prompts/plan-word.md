# plan-word.md
> Word Domain — Implementation Plan
> Depends on: plan-models.md, plan-jamo.md
> Status: draft — awaiting review

---

## What This Domain Does

Defines the `Word` type, derives the jamo pool from a word, normalizes that pool to hide rotation information, and handles loading words from the static data file.

**Boundaries:**
- In: raw Korean word strings, the static words JSON file
- Out: `Word` branded strings, derived pool jamo arrays, selected words
- Calls into: `src/lib/jamo/` for decomposition and rotation lookup
- No knowledge of: game state, UI, React, pool tokens, submission

All exports are pure functions or readonly constants except `loadWords()` which calls `fetch`.

---

## File Map

```
src/lib/word/
├── types.ts          # Word branded type, WordSelectionStrategy
├── word.ts           # createWord(), derivePool(), normalizePool()
├── loader.ts         # loadWords(), selectWord()
├── word.test.ts
└── loader.test.ts

public/data/
└── words.json        # static word list
```

---

## Data: `public/data/words.json`

Shape of the static file fetched at game start:

```typescript
type WordsFile = {
  version: string       // data format version, e.g. '1.0.0'
  words: string[]       // array of Korean syllable block strings, e.g. ['한국어', '사랑']
}
```

No puzzle metadata, no difficulty field, no pool definition — everything is derived from the word string itself. For MVP, this file is a small hand-curated list sufficient for testing.

---

## Implementation Steps

### Step 1 — `types.ts`

```typescript
// A Word is a non-empty string of Korean syllable blocks (U+AC00–U+D7A3).
// The brand prevents plain strings from being passed where a validated Word is expected.
export type Word = string & { readonly _brand: 'Word' }

// Strategies for selecting a word from the list
export type WordSelectionStrategy =
  | { kind: 'daily' }                     // date-seeded, same for all players each day
  | { kind: 'random' }                    // random each call (dev)
  | { kind: 'fixed'; word: string }       // specific word by value (dev)
  | { kind: 'byDate'; date: string }      // ISO date 'YYYY-MM-DD' (dev)
```

---

### Step 2 — `word.ts`: `createWord`

```typescript
import { decomposeSyllable } from '../jamo/composition'

// Validates and brands a raw string as a Word.
// Returns null if the string is empty or contains any non-syllable-block characters.
export function createWord(s: string): Word | null {
  if (s.length === 0) return null
  const chars = [...s]
  const allSyllables = chars.every(ch => {
    const cp = ch.codePointAt(0)
    return cp !== undefined && cp >= 0xAC00 && cp <= 0xD7A3
  })
  if (!allSyllables) return null
  return s as Word
}
```

---

### Step 3 — `word.ts`: `derivePool`

Decomposes every syllable in the word into its constituent jamo. Returns them as a flat ordered array — one entry per jamo, in reading order (left to right, choseong before jungseong before jongseong for each character).

```typescript
// Returns the natural jamo constituents of a word, in reading order.
// Jamo are in their natural (possibly rotated) form — not yet normalized.
// e.g. '한국어' → ['ㅎ','ㅏ','ㄴ', 'ㄱ','ㅜ','ㄱ', 'ㅇ','ㅓ']
export function derivePool(word: Word): readonly string[] {
  return [...word].flatMap(syllable => {
    const parts = decomposeSyllable(syllable)
    if (parts === null) return []   // should not happen for a valid Word
    const jamo: string[] = [parts.choseong, parts.jungseong]
    if (parts.jongseong !== null) jamo.push(parts.jongseong)
    return jamo
  })
}
```

**Gotcha**: compound batchim jongseong (e.g. ㄳ) must be decomposed into their constituent basic jamo before being added to the pool — the pool only ever holds basic consonants and vowels. `decomposeSyllable` returns the compound batchim as a single jamo string (e.g. `'ㄳ'`). A second decomposition step is needed to split compound batchim:

```typescript
// Returns the basic jamo components of a jongseong.
// For a simple jongseong, returns [jongseong].
// For a compound batchim, returns its two constituents.
// e.g. 'ㄳ' → ['ㄱ', 'ㅅ'],  'ㄴ' → ['ㄴ']
export function expandJongseong(jongseong: string): string[] {
  // Look up in JONGSEONG_UPGRADE_RULES for a rule whose output matches
  const rule = JONGSEONG_UPGRADE_RULES.find(r => r.output === jongseong)
  if (rule) return [rule.existing, rule.additional]
  return [jongseong]
}
```

Updated `derivePool`:

```typescript
export function derivePool(word: Word): readonly string[] {
  return [...word].flatMap(syllable => {
    const parts = decomposeSyllable(syllable)
    if (parts === null) return []
    const jamo: string[] = [parts.choseong, parts.jungseong]
    if (parts.jongseong !== null) {
      jamo.push(...expandJongseong(parts.jongseong))
    }
    return jamo
  })
}
```

Similarly, complex vowel jungseong (e.g. ㅐ, ㅞ) must be expanded into their constituent basic vowels. A parallel `expandJungseong` function handles this using `COMBINATION_RULES`:

```typescript
// Returns the basic vowel components of a jungseong.
// For a basic vowel, returns [jungseong].
// For a complex vowel, recursively expands until all components are basic.
// e.g. 'ㅙ' → ['ㅗ','ㅏ','ㅣ'],  'ㅏ' → ['ㅏ']
export function expandJungseong(jungseong: string): string[] {
  const rule = COMBINATION_RULES.find(r => r.output === jungseong)
  if (!rule) return [jungseong]
  // Recursively expand in case an input is itself complex (e.g. ㅙ = ㅗ + ㅐ, ㅐ = ㅏ + ㅣ)
  return [...expandJungseong(rule.inputs[0]), ...expandJungseong(rule.inputs[1])]
}
```

Final `derivePool`:

```typescript
export function derivePool(word: Word): readonly string[] {
  return [...word].flatMap(syllable => {
    const parts = decomposeSyllable(syllable)
    if (parts === null) return []
    return [
      parts.choseong,
      ...expandJungseong(parts.jungseong),
      ...(parts.jongseong !== null ? expandJongseong(parts.jongseong) : []),
    ]
  })
}
```

---

### Step 4 — `word.ts`: `normalizePool`

Rotates each jamo to the 0-index member of its rotation set. Jamo not in any rotation set are returned unchanged. This step ensures the starting pool does not reveal which jamo in the target word are rotated forms of pool jamo.

```typescript
import { ROTATION_SETS } from '../jamo/jamo-data'

// Returns the 0-index member of the rotation set containing this jamo,
// or the jamo itself if it is not in any rotation set.
function toBaseRotation(jamo: string): string {
  const set = ROTATION_SETS.find(s => s.includes(jamo))
  return set ? set[0] : jamo
}

// Normalizes a pool by rotating each jamo to its base (0-index) rotation state.
// e.g. ['ㄴ','ㅓ','ㅗ'] → ['ㄱ','ㅏ','ㅏ']
export function normalizePool(jamo: readonly string[]): readonly string[] {
  return jamo.map(toBaseRotation)
}
```

**Called once at game init**: `normalizePool(derivePool(word))` produces the starting pool.

---

### Step 5 — `loader.ts`: `loadWords` and `selectWord`

```typescript
import { createWord } from './word'
import type { Word, WordSelectionStrategy } from './types'

// Fetches and parses the words JSON file.
// Returns a validated array of Word — invalid entries are filtered out with a console warning.
export async function loadWords(): Promise<Word[]> {
  const response = await fetch('/data/words.json')
  if (!response.ok) throw new Error(`Failed to load words: ${response.status}`)
  const data = await response.json() as { version: string; words: string[] }
  return data.words.flatMap(raw => {
    const word = createWord(raw)
    if (word === null) {
      console.warn(`words.json: invalid entry skipped: "${raw}"`)
      return []
    }
    return [word]
  })
}

// Selects a word from the list according to the given strategy.
// Returns null if the list is empty or the fixed word is not found.
export function selectWord(
  words: Word[],
  strategy: WordSelectionStrategy,
): Word | null {
  if (words.length === 0) return null

  switch (strategy.kind) {
    case 'daily': {
      const index = dailyIndex(words.length)
      return words[index] ?? null
    }
    case 'random': {
      return words[Math.floor(Math.random() * words.length)] ?? null
    }
    case 'fixed': {
      return words.find(w => w === strategy.word) ?? null
    }
    case 'byDate': {
      const index = dateIndex(strategy.date, words.length)
      return words[index] ?? null
    }
  }
}

// Derives a stable index from today's date (UTC).
function dailyIndex(total: number): number {
  const today = new Date().toISOString().slice(0, 10)   // 'YYYY-MM-DD'
  return dateIndex(today, total)
}

// Derives a stable index from a given ISO date string.
// Uses a simple hash: sum of char codes modulo total.
// Stable: same date always produces the same index for a given word list length.
function dateIndex(date: string, total: number): number {
  const hash = date.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return hash % total
}
```

**Gotcha**: `dateIndex` uses a simple charCode sum hash. This is stable and fast but not uniform — words at lower indices will be selected more often for some list lengths. For MVP this is acceptable. If fairness matters, replace with a stronger hash function.

**Gotcha**: `fetch('/data/words.json')` uses a root-relative path. With Vite's `base` config set to `'/<repo-name>/'` for GitHub Pages, this path must be `import.meta.env.BASE_URL + 'data/words.json'`. The agent must use `import.meta.env.BASE_URL` here, not a hardcoded `/`.

---

## Test Coverage Required

### `word.test.ts`

- `createWord('한국어')` returns a `Word` (non-null)
- `createWord('')` returns `null`
- `createWord('hello')` returns `null` (not syllable blocks)
- `createWord('한a')` returns `null` (mixed)
- `derivePool` on `'가'` → `['ㄱ','ㅏ']`
- `derivePool` on `'한'` → `['ㅎ','ㅏ','ㄴ']`
- `derivePool` on `'해'` → `['ㅎ','ㅏ','ㅣ']` (ㅐ expands to ㅏ+ㅣ)
- `derivePool` on `'훿'` → `['ㅎ','ㅜ','ㅓ','ㅣ','ㄱ','ㅅ']` (ㅞ→ㅜ+ㅓ+ㅣ, ㄳ→ㄱ+ㅅ)
- `normalizePool(['ㄴ','ㅓ','ㅠ','ㅡ'])` → `['ㄱ','ㅏ','ㅑ','ㅣ']`
- `normalizePool(['ㅎ','ㄷ'])` → `['ㅎ','ㄷ']` (not rotatable — unchanged)
- Full pipeline: `normalizePool(derivePool(createWord('한국어')!))` produces only base-rotation jamo

### `loader.test.ts`

- `selectWord(['가','나','다'], { kind: 'fixed', word: '나' })` === `'나'`
- `selectWord(['가','나','다'], { kind: 'fixed', word: '없음' })` === `null`
- `selectWord([], { kind: 'daily' })` === `null`
- `selectWord(words, { kind: 'byDate', date: 'X' })` returns the same word for repeated calls with the same date (stability)
- `selectWord(words, { kind: 'byDate', date: 'X' })` vs `{ kind: 'byDate', date: 'Y' }` may differ (sensitivity)

---

## ⚑ Assumptions

**W1 — Complex vowel expansion is recursive**
`expandJungseong` recurses to handle multi-step complex vowels like ㅙ (ㅗ + ㅐ = ㅗ + ㅏ + ㅣ). The recursion depth is bounded at 2 (no complex vowel requires more than two expansion steps). Confirm this is the intended pool derivation — the player receives individual basic vowels (ㅗ, ㅏ, ㅣ) not the intermediate combined form (ㅐ).

**W2 — `words.json` path uses `import.meta.env.BASE_URL`**
Required for correct resolution under GitHub Pages with a non-root base path. The agent must not hardcode `/data/words.json`.

**W3 — Daily index stability across word list changes**
Adding or removing words from `words.json` will change which word is selected for a given date. There is no mechanism to pin past daily puzzles. For MVP this is acceptable — noted so it is a conscious decision if the word list is ever versioned.
