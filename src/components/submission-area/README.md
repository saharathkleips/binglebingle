# components/submission-area

Submission area where the player assembles syllable characters and submits guesses. Slots accept tiles from the pool; filled slots return tiles on tap or when dragged outside the submission zone.

## Exports

- `SubmissionArea` — renders submission slots and submit button from `useGame()` state; no props
- `SubmissionSlot` — single slot; empty = thin bordered drop target placeholder with centered flower, filled = shows character, removes on tap or outside-zone drop, draggable to other slots via GSAP Draggable
- `SubmissionButton` — validates via `canSubmit` and dispatches `ROUND_SUBMISSION_SUBMIT`; renders the cream neo-brutalist submit control with mugunghwa motifs and hover/press feedback
