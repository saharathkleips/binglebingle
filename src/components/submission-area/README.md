# components/submission-area

Submission area where the player assembles syllable characters and submits guesses. Slots accept tiles from the pool; filled slots return tiles on tap.

## Exports

- `SubmissionArea` — renders submission slots and submit button from `useGame()` state; no props
- `SubmissionSlot` — single slot; empty = frame-shaped drop target placeholder, filled = shows character, removes on tap, draggable to other slots via GSAP Draggable
- `SubmissionButton` — validates via `canSubmit` and dispatches `ROUND_SUBMISSION_SUBMIT`
