# Word Slice — Public Contract

**Slice:** `src/lib/word/`
**Status:** stable

## Exports

### `word.ts`

| Export                  | Description                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `Word`                  | Branded string type — non-empty sequence of Korean syllable blocks (U+AC00–U+D7A3) |
| `WordSelectionStrategy` | Discriminated union: `daily`, `random`, `fixed`, `byDate`                          |
| `createWord(s)`         | Validates and brands a raw string; returns `null` on failure                       |
| `decomposeJamo(jamo)`   | One-step decomposition of a jamo into its immediate constituents                   |
| `derivePool(word)`      | Fully decomposes every syllable to basic jamo                                      |
| `normalizePool(jamo)`   | Rotates each jamo to the 0-index of its rotation set                               |

### `loader.ts`

| Export                        | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| `loadWords()`                 | Fetches `public/data/words.json`, validates each entry via `createWord` |
| `selectWord(words, strategy)` | Selects a word by strategy (daily, random, fixed, byDate)               |

## Usage

```typescript
import { createWord, derivePool, normalizePool } from "src/lib/word/word";
import { loadWords, selectWord } from "src/lib/word/loader";

const words = await loadWords();
const word = selectWord(words, { kind: "daily" });
const pool = normalizePool(derivePool(word));
```

## Boundaries

- Calls into: `src/lib/jamo/` for decomposition and rotation lookups
- No knowledge of: game state, pool tokens, UI, React
