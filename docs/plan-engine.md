# plan-engine.md

> Engine Domain — Implementation Plan
> Depends on: plan-models.md, plan-jamo.md, plan-word.md
> Status: draft — awaiting review

---

## What This Domain Does

The game rules. Given a submission and a target word, the engine answers two questions: can this be submitted, and what does it score?

**Boundaries:**

- In: `SubmissionState`, `PoolState`, `Word`, `GuessRecord`
- Out: `ValidationResult`, `GuessRecord`, `ScoringResult`
- Calls into: `src/lib/jamo/`, `src/lib/character/`, `src/lib/word/`
- No knowledge of: React, state management, UI, loading

All exports are pure functions. No side effects.

---

## File Map

```
src/lib/engine/
├── validate.ts        # canSubmit()
├── evaluate.ts        # evaluateGuess()
├── scoring.ts         # calculateScore()
├── validate.test.ts
├── evaluate.test.ts
└── scoring.test.ts
```

---

## What Validation Is (and Isn't)

Because the reducer already enforces that:

- Only pool tokens can be placed in submission slots
- Only valid combinations are accepted (`combineJamo` and `upgradeJongseong` return null on invalid input)
- Rotation only produces members of a rotation set

...the engine does **not** need to re-verify that the submission's characters are constructible from the pool. That invariant is maintained by the state machine. The engine's job at submission time is narrower: check whether the current submission state meets the conditions required to submit a guess.

---

## Implementation Steps

### Step 1 — `validate.ts`: `canSubmit`

```typescript
import { isComplete } from "../character/character";
import type { SubmissionState } from "../../state/types";

type ValidationResult = { valid: true } | { valid: false; reason: ValidationFailureReason };

type ValidationFailureReason =
  | "NO_CHARACTERS" // no slots are filled at all
  | "INCOMPLETE_CHARACTER"; // at least one filled slot has an incomplete character

// Returns whether the current submission state can be submitted as a guess.
export function canSubmit(submission: SubmissionState): ValidationResult {
  const filled = submission.filter((slot) => slot.filled);

  if (filled.length === 0) {
    return { valid: false, reason: "NO_CHARACTERS" };
  }

  const hasIncomplete = filled.some((slot) => slot.filled && !isComplete(slot.character));
  if (hasIncomplete) {
    return { valid: false, reason: "INCOMPLETE_CHARACTER" };
  }

  return { valid: true };
}
```

**What this does not check:**

- Whether characters are real Korean words — not required by the game rules
- Whether all slots are filled — the player may submit a partial guess; empty slots evaluate as `'absent'`
- Whether characters are derivable from the pool — guaranteed by the reducer

---

### Step 2 — `evaluate.ts`: `evaluateGuess`

Produces a `GuessRecord` from a submission and the target word. Empty slots produce `'absent'` without a character string.

The evaluation algorithm follows the standard two-pass approach to handle duplicate characters correctly.

```typescript
import type { SubmissionState } from "../../state/types";
import type { Word } from "../word/types";
import type { GuessRecord, EvaluatedCharacter } from "../engine/types";
import { resolveCharacter } from "../character/character";

export function evaluateGuess(submission: SubmissionState, word: Word): GuessRecord {
  const target = [...word]; // e.g. ['한','국','어']
  const guessed = submission.map((slot) => (slot.filled ? resolveCharacter(slot.character) : null)); // e.g. ['한', null, '어']

  const results: CharacterResult[] = new Array(target.length).fill("absent");
  const targetAvailable = target.map(() => true); // tracks unmatched target positions

  // Pass 1: mark exact matches (correct)
  for (let i = 0; i < target.length; i++) {
    if (guessed[i] !== null && guessed[i] === target[i]) {
      results[i] = "correct";
      targetAvailable[i] = false;
    }
  }

  // Pass 2: mark present characters (in word, wrong position)
  for (let i = 0; i < target.length; i++) {
    if (results[i] === "correct") continue; // already matched
    if (guessed[i] === null) continue; // empty slot — stays 'absent'

    const matchIndex = target.findIndex((ch, j) => targetAvailable[j] && ch === guessed[i]);
    if (matchIndex !== -1) {
      results[i] = "present";
      targetAvailable[matchIndex] = false;
    }
  }

  // Assemble GuessRecord — character and result always together
  return submission.map(
    (slot, i): EvaluatedCharacter => ({
      character: guessed[i] ?? "", // empty string for unfilled slots
      result: results[i],
    }),
  );
}
```

**On duplicate handling:** Consider target `'간'` and guess `['가','가','간']`. Pass 1 marks position 2 as `correct` and removes that `'간'` from available. Pass 2 then looks for `'가'` — finds one available, marks position 0 as `present`, removes it. Position 1 (`'가'`) finds no remaining `'가'` in target and stays `'absent'`. This matches standard Wordle duplicate semantics.

**On empty slots:** An empty slot always produces `result: 'absent'` with `character: ''`. The UI can distinguish an empty slot from a wrong-character absent by checking `character === ''` if needed.

---

### Step 3 — `scoring.ts`: `calculateScore`

```typescript
import type { GuessRecord } from "./types";

type ScoringResult = {
  guessCount: number;
};

// Returns the score for a completed game.
// guesses is the full history of all submitted GuessRecords.
export function calculateScore(guesses: readonly GuessRecord[]): ScoringResult {
  return { guessCount: guesses.length };
}
```

Simple for MVP — score equals the number of guesses taken. `ScoringResult` is a type rather than a bare number to make it extensible (par scoring, streaks, etc.) without breaking callers.

---

### Step 4 — `engine/types.ts`

Types that belong to the engine domain and are imported by other domains:

```typescript
export type CharacterResult = "correct" | "present" | "absent";

export type EvaluatedCharacter = {
  character: string; // resolved syllable string, or '' for an empty slot
  result: CharacterResult;
};

export type GuessRecord = readonly EvaluatedCharacter[];

export type ValidationResult = { valid: true } | { valid: false; reason: ValidationFailureReason };

export type ValidationFailureReason = "NO_CHARACTERS" | "INCOMPLETE_CHARACTER";

export type ScoringResult = {
  guessCount: number;
};
```

> **Note for agent**: `GuessRecord`, `EvaluatedCharacter`, and `CharacterResult` were previously typed in `src/state/types.ts` in plan-models.md. Move them to `src/lib/engine/types.ts` — they are engine outputs, not state definitions. `src/state/types.ts` imports them from here.

---

## Test Coverage Required

### `validate.test.ts`

Setup helper: build a `SubmissionState` from an array of `Character | null` values.

- All slots empty → `{ valid: false, reason: 'NO_CHARACTERS' }`
- One complete character, rest empty → `{ valid: true }`
- All slots filled with complete characters → `{ valid: true }`
- One filled slot with an incomplete character (e.g. `{ jamo: ['ㄱ'] }`) → `{ valid: false, reason: 'INCOMPLETE_CHARACTER' }`
- Mix of complete and incomplete filled slots → `{ valid: false, reason: 'INCOMPLETE_CHARACTER' }`
- Mix of complete filled and empty slots → `{ valid: true }`

### `evaluate.test.ts`

For a 3-character word `'한국어'`:

- Exact match `['한','국','어']` → all `'correct'`
- All wrong `['가','나','다']` → all `'absent'`
- Right characters wrong positions `['국','어','한']` → all `'present'`
- Mixed `['한','나','어']` → `['correct','absent','correct']` (wait, '어' is at position 2 and target position 2 is '어' → correct)
- Empty slot in middle `['한', empty, '어']` → `['correct','absent','correct']`
- All empty → all `'absent'`

Duplicate handling — target `'아아아'`, guess `['아', empty, empty]`:

- Position 0 is `'correct'`; positions 1 and 2 are `'absent'` (not `'present'` — the remaining two `'아'` in target are consumed by the empty slots which skip them)

Wait — empty slots do not consume target characters. Re-stating: target `'아아아'`, guess `['아', empty, '나']`:

- Pass 1: position 0 `'아'` === target[0] `'아'` → `'correct'`, targetAvailable[0] = false
- Pass 2: position 1 is empty → skip. Position 2 `'나'` — not in remaining target → `'absent'`
- Result: `['correct', 'absent', 'absent']`

Additional duplicate test — target `'가가나'`, guess `['가', empty, '가']`:

- Pass 1: position 0 `'correct'`, position 2 `'가'` !== `'나'` → not marked
- Pass 2: position 2 `'가'` — finds target[1] `'가'` available → `'present'`
- Result: `['correct', 'absent', 'present']`

### `scoring.test.ts`

- 1 guess → `{ guessCount: 1 }`
- 6 guesses → `{ guessCount: 6 }`
- 0 guesses → `{ guessCount: 0 }` (edge case, shouldn't occur in practice)

---

## ⚑ Assumptions

**E1 — Validation is submission-gate only**
`canSubmit` is called immediately before `SUBMIT_GUESS` is dispatched. It is not called continuously during guess construction — that would be the UI's responsibility (e.g. disabling the submit button). The engine doesn't poll; it answers one question at one moment.

**E2 — `resolveCharacter` on a submission slot's character is always a complete syllable**
By the time `evaluateGuess` is called, `canSubmit` has returned `{ valid: true }`, which means all filled slots have complete characters. `resolveCharacter` on a complete character always returns a syllable block string. The `?? ''` fallback in `evaluateGuess` is defensive — it should never be reached for filled slots.

**E3 — Empty slot `character` field is `''`**
An empty slot in `GuessRecord` has `character: ''`. The UI can test `character === ''` to distinguish empty from absent-by-wrong-character if different visual treatment is needed. Currently both produce `result: 'absent'` — this was confirmed as acceptable in plan-models.md (M2).
