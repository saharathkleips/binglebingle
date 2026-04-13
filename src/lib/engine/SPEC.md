# SPEC: Engine

**Status:** draft
**Slice:** `src/lib/engine/`

## Purpose

The game rules. Given a submission and a target word, answers: can this be submitted, what does it evaluate to, and what is the score?

**Boundaries:**

- In: `SubmissionState`, `Word`, `readonly GuessRecord[]`
- Out: `ValidationResult`, `GuessRecord`, `ScoringResult`
- Calls into: `src/lib/jamo/`, `src/lib/character/`, `src/lib/word/`
- No knowledge of: React, state management, UI, loading

## File Map

```
src/lib/engine/
├── validate.ts       # canSubmit()
├── evaluate.ts       # evaluateGuess()
├── scoring.ts        # calculateScore()
├── types.ts          # engine-owned types (GuessRecord, CharacterResult, etc.)
├── validate.test.ts
├── evaluate.test.ts
├── scoring.test.ts
└── README.md
```

## Types

```typescript
// types.ts
export type CharacterResult = "correct" | "present" | "absent";

export type EvaluatedCharacter = {
  character: string; // resolved syllable string, or '' for an empty slot
  result: CharacterResult;
};

export type GuessRecord = readonly EvaluatedCharacter[];

export type ValidationResult = { valid: true } | { valid: false; reason: ValidationFailureReason };

export type ValidationFailureReason =
  | "NO_CHARACTERS" // no slots filled at all
  | "INCOMPLETE_CHARACTER"; // at least one filled slot has an incomplete character

export type ScoringResult = {
  guessCount: number;
};
```

> `GuessRecord`, `EvaluatedCharacter`, and `CharacterResult` are engine outputs — they live here, not in `src/state/types.ts`. State imports them from here.

## Functions

### `canSubmit(submission: SubmissionState): ValidationResult`

Checks whether the current submission can be submitted. Does **not** check:

- Whether characters are real Korean words
- Whether all slots are filled (partial guesses allowed; empty slots → `'absent'`)
- Whether characters are constructible from the pool (guaranteed by reducer invariants)

### `evaluateGuess(submission: SubmissionState, word: Word): GuessRecord`

Two-pass algorithm (standard Wordle duplicate semantics):

1. Pass 1: mark exact position matches as `'correct'`, remove from available target pool
2. Pass 2: mark remaining filled slots as `'present'` if character exists in remaining target pool, else `'absent'`

Empty slots always produce `result: 'absent'`, `character: ''`.

### `calculateScore(guesses: readonly GuessRecord[]): ScoringResult`

MVP: `{ guessCount: guesses.length }`. `ScoringResult` is typed for extensibility.

## Key Decisions

**E1 — Validation is submission-gate only.** `canSubmit` is called once before dispatch, not continuously. Disabling the submit button is the UI's job.

**E2 — Engine does not compute evaluation; reducer does not evaluate.** `SUBMIT_GUESS` receives a pre-computed `GuessRecord` in its payload. The caller computes it via `evaluateGuess` before dispatching.

**E3 — Empty slot `character` is `''`.** UI can distinguish empty-slot absent from wrong-character absent by checking `character === ''` if different visual treatment is needed.
