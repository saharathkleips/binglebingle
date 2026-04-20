# components/submission-area

Submission area where the player assembles syllable characters and submits guesses. Slots accept tiles from the pool (drag wired in UI-04); filled slots return tiles on tap.

## Exports

- `SubmissionArea` — renders submission slots and submit button from `useGame()` state; no props
- `SubmissionSlot` — single slot; empty = drop target placeholder, filled = shows character and removes on tap
- `SubmissionButton` — validates via `canSubmit` and dispatches `ROUND_SUBMISSION_SUBMIT`
