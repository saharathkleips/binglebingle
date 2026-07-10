# components/submission-area

Submission area where the player assembles syllable characters and submits guesses. Slots accept tiles from the pool; filled slots return tiles on tap or when dragged outside the submission zone.

## Exports

- `SubmissionArea` — renders submission slots and submit button from `useGame()` state; no props
- `SubmissionSlot` — single slot; empty = thin bordered drop target placeholder with centered lotus motif and solid tile-depth (no cast shadow), filled = shows character over a persistently rendered ghost placeholder that is revealed by tile lift/drag/placement instead of being toggled on hover; removes on tap or outside-zone drop, draggable to other slots via GSAP Draggable
- `useSubmissionSlotDraggable` — hook that owns filled-slot GSAP Draggable setup, slot drop-target feedback, snap-back swap drops, tap handling, and animated return-to-pool drag behavior
- `SubmissionButton` — validates via `canSubmit` and dispatches `ROUND_SUBMISSION_SUBMIT`; renders the cream neo-brutalist submit control with hills motifs and hover/press feedback
