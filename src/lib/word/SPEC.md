# SPEC: Word

**Status:** draft
**Slice:** `src/lib/word/`

## Purpose

Defines the `Word` branded type and the functions for validating words, decomposing them into constituent basic jamo (the starting pool), and loading/selecting words for play.

**Boundaries:**
- In: raw Korean word strings, `WordSelectionStrategy`
- Out: validated `Word` values, ordered jamo arrays, loaded word lists
- Calls into: `src/lib/jamo/` for decomposition and rotation lookups
- No knowledge of: game state, pool tokens, UI, React

## File Map

```
src/lib/word/
├── word.ts         # createWord(), derivePool(), normalizePool(), decomposeJamo()
├── loader.ts       # loadWords(), selectWord()
├── word.test.ts
├── loader.test.ts
└── README.md
```

## Types

```typescript
// A Word is a non-empty string of Korean syllable blocks (U+AC00–U+D7A3).
// The brand prevents plain strings from being passed where a validated Word is expected.
export type Word = string & { readonly _brand: "Word" };

// Strategies for selecting a word
export type WordSelectionStrategy =
  | { kind: "daily" }
  | { kind: "random" }
  | { kind: "fixed"; word: string }
  | { kind: "byDate"; date: string }; // ISO date 'YYYY-MM-DD'
```

Derived properties — computed, never stored:
```typescript
const chars: string[] = [...word];       // individual syllable blocks
const length: number = [...word].length; // Unicode-safe length
```

## Functions

### `createWord(s: string): Word | null`
Validates and brands a raw string. Returns `null` if empty or if any character is outside U+AC00–U+D7A3.

### `decomposeJamo(jamo: string): string[]`
Decomposes a jamo by **one step** into its immediate constituents — mirrors the player's split action.
- `'ㅐ'` → `['ㅏ','ㅣ']`
- `'ㅙ'` → `['ㅗ','ㅐ']` (not `['ㅗ','ㅏ','ㅣ']` — one step only)
- `'ㄳ'` → `['ㄱ','ㅅ']`
- `'ㄱ'` → `['ㄱ']` (basic — no rule)

### `derivePool(word: Word): readonly string[]`
Fully decomposes every syllable to basic jamo by iterating `decomposeJamo` until stable.
`'훿'` → `['ㅎ','ㅜ','ㅓ','ㅣ','ㄱ','ㅅ']`

### `normalizePool(jamo: readonly string[]): readonly string[]`
Rotates each jamo to the 0-index member of its rotation set. Non-rotatable jamo unchanged. Called once after `derivePool` at game init to prevent the pool from revealing which target jamo are rotated.

**Full pipeline at game init:**
```typescript
const poolJamo = normalizePool(derivePool(word));
```

### `loadWords(): Promise<readonly Word[]>`
Fetches `public/data/words.json` and validates each entry via `createWord`.

### `selectWord(words: readonly Word[], strategy: WordSelectionStrategy): Word`
Selects a word by strategy. `daily` uses a date-seeded index; `random` picks uniformly; `fixed` returns the specified word; `byDate` selects as if it were the given date.

## Key Decisions

**W1 — `decomposeJamo` is one step only.** `toBasicJamo` iterates until stable internally. `derivePool` always produces only basic jamo — the `훿` test case verifies this for the most complex input.

**W2 — `derivePool` is also useful standalone.** Game init calls `normalizePool(derivePool(word))`, but `derivePool` alone is useful for decomposing arbitrary words outside of game init.
