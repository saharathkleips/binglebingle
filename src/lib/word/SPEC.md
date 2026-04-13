# SPEC: Word

**Status:** stable
**Slice:** `src/lib/word/`

## Purpose

Defines the `Word` type and the functions for constructing words from strings, decomposing them
into their constituent jamo Characters (the starting pool), and converting words back to strings.

**Boundaries:**

- In: raw Korean word strings
- Out: validated `Word` values, ordered jamo Character arrays
- Calls into: `src/lib/character/` for construction, decomposition, and resolution; `src/lib/jamo/rotation` for pool normalization
- No knowledge of: game state, word selection, I/O, UI, React

## File Map

```
src/lib/word/
├── word.ts         # Word type, createWord(), derivePool(), normalizePool(), wordToString()
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

### `createWord(s: string): Word | null`

Parses and validates a raw string. Uses `decomposeSyllable` + `character()` + `isComplete()` to
convert each codepoint to a `CompleteCharacter`. Returns `null` if the string is empty or any
character is outside U+AC00–U+D7A3.

### `derivePool(word: Word): readonly Character[]`

Fully decomposes every syllable to basic single-jamo Characters by iterating `decompose()` from
`character/` until stable. Each output element has `decompose(char).length === 1`.

### `normalizePool(pool: readonly Character[]): readonly Character[]`

Rotates each single-jamo Character to the 0-index member of its rotation set via `getRotationBase`.
Non-rotatable jamo are returned unchanged.

**Full pipeline at game init:**

```typescript
const pool = normalizePool(derivePool(word));
```

### `wordToString(word: Word): string`

Converts a Word back to its Unicode string by resolving each CompleteCharacter.

## Key Decisions

**W1 — `Word = readonly CompleteCharacter[]`, no brand.** The type itself enforces the invariant —
only `OPEN_SYLLABLE` and `FULL_SYLLABLE` Characters are valid elements, and `isComplete()` from
`character/` is the gate. A brand on an array type adds no structural safety.

**W2 — `derivePool` delegates to `character/decompose`.** Pool derivation is iterative
decomposition, which `decompose()` already implements correctly (including compound batchim,
double consonants, and multi-step complex vowels). No reimplementation in this slice.

**W3 — Pool elements are typed as `Character`, not `CompleteCharacter`.** After full decomposition
all elements are single-jamo (`CHOSEONG_ONLY`, `JUNGSEONG_ONLY`, or `CHOSEONG_ONLY` for former
jongseong), none of which satisfy `isComplete`. Narrowing to a `SingleJamoCharacter` subtype is
possible but adds no value at the current call sites.

**W4 — Word selection and loading live in `src/lib/puzzle/`.** Which word to play is a
game-initialization concern, not a word-domain concern. `word/` has no knowledge of I/O or
selection strategy.
