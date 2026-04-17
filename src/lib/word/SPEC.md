# SPEC: Word

**Status:** stable

## Purpose

Defines the `Word` type and the functions for constructing words from strings and converting words back to strings.

**Boundaries:**

- In: raw Korean word strings
- Out: validated `Word` values
- Calls into: `src/lib/character/` for construction and resolution
- No knowledge of: game state, pool, word selection, I/O, UI, React

## File Map

```
word/
├── index.ts        # Word type, createWord(), wordToString()
├── word.test.ts
└── README.md
```

## Types

```typescript
// A Word is a non-empty array of CompleteCharacter (OPEN_SYLLABLE | FULL_SYLLABLE).
// Each element resolves to a codepoint in U+AC00–U+D7A3.
// Use createWord() to construct from a raw string.
export type Word = readonly CompleteCharacter[];
```

Derived properties — computed, never stored:

```typescript
const length: number = word.length; // number of syllable characters
const str: string = wordToString(word); // resolved Unicode string
```

## Functions

### `createWord(word: string) => Word | null`

Parses and validates a raw string. Uses `character(syllable)` to convert each codepoint to a
`CompleteCharacter`. Returns `null` if the string is empty or any character is outside U+AC00–U+D7A3.

### `wordToString(word: Word) => string`

Converts a Word back to its Unicode string by resolving each CompleteCharacter.

## Key Decisions

**`Word = readonly CompleteCharacter[]`, no brand.** The type itself enforces the invariant —
only `OPEN_SYLLABLE` and `FULL_SYLLABLE` Characters are valid elements, and `isComplete()` from
`character/` is the gate. A brand on an array type adds no structural safety.

**Word selection, loading, and pool derivation live in `src/lib/puzzle/`.** These are
game-initialization concerns. `word/` has no knowledge of I/O, selection strategy, or pools.
