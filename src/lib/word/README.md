# Word Slice — Public Contract

**Slice:** `src/lib/word/`
**Status:** stable

## Exports

### `word.ts`

| Export            | Description                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- |
| `Word`            | `readonly CompleteCharacter[]` — ordered array of complete Korean syllable characters |
| `createWord(s)`   | Parses and validates a raw string; returns `Word` or `null`                           |
| `wordToString(w)` | Converts a `Word` back to its Unicode string                                          |

## Usage

```typescript
import { createWord } from "src/lib/word/word";

const word: Word | null = createWord("한국어");
```

## Boundaries

- Calls into: `src/lib/character/` for construction and resolution
- No knowledge of: word selection, I/O, game state, UI, React
- Word loading and selection live in `src/lib/puzzle/`
