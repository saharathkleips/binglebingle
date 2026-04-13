# Word Slice — Public Contract

**Slice:** `src/lib/word/`
**Status:** stable

## Exports

### `word.ts`

| Export                  | Description                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `Word`                  | `readonly CompleteCharacter[]` — ordered array of complete Korean syllable characters      |
| `WordSelectionStrategy` | Discriminated union: `daily`, `random`, `fixed`, `byDate`                                  |
| `createWord(s)`         | Parses and validates a raw string; returns `Word` or `null`                                |
| `derivePool(word)`      | Fully decomposes every syllable to basic single-jamo `Character` objects via `decompose()` |
| `normalizePool(pool)`   | Rotates each jamo `Character` to the 0-index of its rotation set                           |
| `wordToString(word)`    | Converts a `Word` back to its Unicode string                                               |

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
const pool = normalizePool(derivePool(word)); // readonly Character[]
```

## Boundaries

- Calls into: `src/lib/character/` for construction, decomposition, and resolution
- Calls into: `src/lib/jamo/rotation` for `getRotationBase` in pool normalization
- No knowledge of: game state, pool tokens, UI, React
