# Word Slice — Public Contract

**Slice:** `src/lib/word/`
**Status:** stable

## Exports

### `word.ts`

| Export                | Description                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `Word`                | `readonly CompleteCharacter[]` — ordered array of complete Korean syllable characters      |
| `createWord(s)`       | Parses and validates a raw string; returns `Word` or `null`                                |
| `derivePool(word)`    | Fully decomposes every syllable to basic single-jamo `Character` objects via `decompose()` |
| `normalizePool(pool)` | Rotates each jamo `Character` to the 0-index of its rotation set                           |
| `wordToString(word)`  | Converts a `Word` back to its Unicode string                                               |

## Usage

```typescript
import { createWord, derivePool, normalizePool } from "src/lib/word/word";

const word: Word | null = createWord("한국어");
const pool: readonly Character[] = normalizePool(derivePool(word));
```

## Boundaries

- Calls into: `src/lib/character/` for construction, decomposition, resolution, and pool normalization
- No knowledge of: word selection, I/O, game state, UI, React
- Word loading and selection live in `src/lib/puzzle/`
