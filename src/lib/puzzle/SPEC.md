# SPEC: puzzle

**Status:** stable

## Purpose

Owns the game-initialization concern of _which word to play_. Loads the word list from the static
asset and selects a word by strategy. Distinct from `src/lib/word/`, which defines what a word
structurally is and how it decomposes.

**Boundaries:**

- In: raw fetch response, `WordSelectionStrategy`
- Out: validated word lists, selected `Word` values
- Calls into: `src/lib/word/` for `createWord` and `wordToString`
- No knowledge of: game state, UI, React

## File Map

```
puzzle/
├── index.ts        # WordSelectionStrategy, loadWords(), selectWord()
├── puzzle.test.ts
├── README.md
└── SPEC.md
```

## Types

```typescript
export type WordSelectionStrategy =
  | { kind: "daily" }
  | { kind: "random" }
  | { kind: "fixed"; word: string }
  | { kind: "byDate"; date: string }; // ISO date 'YYYY-MM-DD'
```

## Functions

### `loadWords() => Promise<readonly Word[]>`

Fetches `public/data/words.json` and validates each string entry via `createWord`. Invalid entries
are silently dropped. Returns an empty array if the JSON is not an array.

### `selectWord(words, strategy) => Word`

Selects a word from the list by the given strategy.

| strategy | behaviour                                                           |
| -------- | ------------------------------------------------------------------- |
| `daily`  | date-seeded index using today's local date                          |
| `random` | uniform random                                                      |
| `fixed`  | find by `wordToString` match; falls back to first word if not found |
| `byDate` | same as `daily` but for the given ISO date string                   |

The date seed converts the ISO date to integer days since the Unix epoch and takes the modulo of
the list length, so the same date always yields the same word regardless of list order changes
that do not reorder existing entries.

## Key Decisions

**Puzzle owns selection strategy, not word/.** `WordSelectionStrategy` is a game-initialization
concept — it has no meaning in the pure word domain. Co-locating it here keeps `word/` free of
application concerns.

**loadWords is the only I/O in the domain layer.** All other domain functions are pure. This
makes puzzle/ the single seam to mock in integration tests.
