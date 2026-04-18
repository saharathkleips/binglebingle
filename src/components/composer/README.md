# components/composer

Submission area where the player assembles syllable characters and submits guesses. Slots accept tiles from the pool (drag wired in UI-04); filled slots return tiles on tap.

## Exports

- `Composer` — renders submission slots and submit button from `useGame()` state; no props
- `SubmissionSlot` — single slot; empty = drop target placeholder, filled = shows character and removes on tap
- `SubmitButton` — validates via `canSubmit` and dispatches `ROUND_SUBMISSION_SUBMIT`
