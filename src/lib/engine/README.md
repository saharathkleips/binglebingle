# Engine Slice — Public Contract

**Slice:** `src/lib/engine/`
**Status:** stable

## Exports

### `types.ts`

| Export                    | Description                                                            |
| ------------------------- | ---------------------------------------------------------------------- |
| `CharacterResult`         | `'correct' \| 'present' \| 'absent'` — per-character evaluation result |
| `EvaluatedCharacter`      | `{ character: string; result: CharacterResult }` — one slot in a guess |
| `GuessRecord`             | `readonly EvaluatedCharacter[]` — a fully evaluated guess              |
| `ValidationFailureReason` | `'NO_CHARACTERS' \| 'INCOMPLETE_CHARACTER'`                            |
| `ValidationResult`        | `{ valid: true } \| { valid: false; reason: ValidationFailureReason }` |
| `ScoringResult`           | `{ guessCount: number }`                                               |

### `validate.ts`

| Export         | Description                                                                  |
| -------------- | ---------------------------------------------------------------------------- |
| `canSubmit(s)` | Returns `ValidationResult` — gates submission on filled, complete characters |

### `evaluate.ts`

| Export                   | Description                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `evaluateGuess(s, word)` | Returns `GuessRecord` — two-pass Wordle duplicate semantics (correct / present / absent) |

### `scoring.ts`

| Export                    | Description                                  |
| ------------------------- | -------------------------------------------- |
| `calculateScore(guesses)` | Returns `ScoringResult` based on guess count |

## Usage

```typescript
import { canSubmit } from "src/lib/engine/validate";
import { evaluateGuess } from "src/lib/engine/evaluate";
import { calculateScore } from "src/lib/engine/scoring";

const validation = canSubmit(submission);
if (validation.valid) {
  const record = evaluateGuess(submission, word);
  const score = calculateScore([...guesses, record]);
}
```

## Boundaries

- Calls into: `src/lib/character/` for character resolution and completion checks; `src/lib/word/` for target word iteration
- No knowledge of: React, state management, UI, word loading
