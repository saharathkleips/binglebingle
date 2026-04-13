# Puzzle Slice — Public Contract

**Slice:** `src/lib/puzzle/`
**Status:** stable

## Exports

### `puzzle.ts`

| Export                        | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| `WordSelectionStrategy`       | Discriminated union: `daily`, `random`, `fixed`, `byDate`               |
| `loadWords()`                 | Fetches `public/data/words.json`, validates each entry via `createWord` |
| `selectWord(words, strategy)` | Selects a word by strategy (daily, random, fixed, byDate)               |

## Usage

```typescript
import { loadWords, selectWord } from "src/lib/puzzle/puzzle";
import { derivePool, normalizePool } from "src/lib/word/word";

const words = await loadWords();
const word = selectWord(words, { kind: "daily" });
const pool = normalizePool(derivePool(word));
```

## Boundaries

- Calls into: `src/lib/word/` for `createWord` and `wordToString`
- No knowledge of: game state, pool, UI, React
