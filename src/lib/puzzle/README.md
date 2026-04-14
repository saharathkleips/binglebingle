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
| `fullDecompose(characters)`   | Fully decomposes a Word to basic single-jamo Characters (recursive)     |

## Usage

```typescript
import { fullDecompose, loadWords, selectWord } from "src/lib/puzzle/puzzle";
import { normalizeCharacter } from "src/lib/character/character";

const words = await loadWords();
const word = selectWord(words, { kind: "daily" });
const pool = fullDecompose(word).map(normalizeCharacter);
```

## Boundaries

- Calls into: `src/lib/word/` for `createWord` and `wordToString`; `src/lib/character/` for `decompose`
- No knowledge of: game state, UI, React
