# engine

The game rules. Given a submission and a target word, answers: can this be submitted, what does it evaluate to, and what is the score?

## Exports

- `Submission` — `readonly (Character | null)[]`; the engine's view of a guess submission
- `CharacterResult` — `'CORRECT' | 'PRESENT' | 'ABSENT'`; per-character evaluation result
- `EvaluatedCharacter` — `{ character?: Character; result: CharacterResult }`; one evaluated slot in a guess
- `GuessRecord` — `readonly EvaluatedCharacter[]`; a fully evaluated guess
- `ValidationFailureReason` — `'NO_CHARACTERS' | 'INCOMPLETE_CHARACTER'`; reason submission was rejected
- `ValidationResult` — `"VALID" | ValidationFailureReason`; outcome of submission validation
- `ScoringResult` — `{ guessCount: number }`; scoring output for a completed game
- `canSubmit(submission) => ValidationResult` — gates submission on at least one filled, complete character; does not validate word membership
- `evaluateGuess(submission, word) => GuessRecord` — two-pass Wordle duplicate semantics (correct / present / absent)
- `isWon(history) => boolean` — true when the last guess record exists and all characters are CORRECT
- `calculateScore(guesses) => ScoringResult` — returns score based on guess count
