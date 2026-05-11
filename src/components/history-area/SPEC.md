# SPEC: components/history-area

**Status:** stable

## Purpose

Renders the guess history read-only. Each past guess is a row of `HistoryTile` components colored by evaluation result.

**Boundaries:**

- Reads from: `useGame()` (state.history)
- Dispatches to: nothing
- Calls into: `src/components/tile` for shared tile visuals and character display

## File Map

```
history-area/
├── HistoryArea.tsx             # History container — maps rows to HistoryTile grids
├── HistoryArea.module.css      # Grid layout for history rows
├── HistoryTile.tsx             # Single evaluated tile — shared display + result tone mapping
├── HistoryArea.test.tsx
├── HistoryTile.test.tsx
├── README.md
└── SPEC.md
```

## Functions

### HistoryArea

Reads `state.history` from `useGame()`. Returns `null` when history is empty. Renders one `<div>` row per `GuessRecord`, each containing a `HistoryTile` per `EvaluatedCharacter`. The container reserves at least `--history-min-visible-rows` rows, then flexes to show as much history as available space allows while scrolling overflow.

### HistoryTile

Receives a single `EvaluatedCharacter`. Renders `CharacterTile` when a character is present, or `BaseTile` with empty content when no character is present. Applies the shared `BaseTile` tone through a `RESULT_TONE` lookup so `CORRECT`, `PRESENT`, and `ABSENT` keep their visual variants without duplicating tile surface CSS.

`data-result` attribute mirrors the result value for test selection and potential CSS attribute targeting. Shared tile visuals live in `tile/BaseTile.module.css`; history rows use `--tile-submission-history-gap` so their portrait-only visual spacing matches submission while remaining independent from pool spacing. History tiles remain inert and do not attach pool or submission interaction behavior.

## Key Decisions

**HistoryArea returns null, not an empty container.** An empty `<div>` would occupy layout space before any guesses are made. Returning `null` keeps the layout clean on the first turn.

**History has a minimum, not a fixed maximum.** `--history-min-visible-rows` preserves the minimum history affordance, but the area can grow when the pool and submission regions leave extra vertical space.

**Rows anchor to the submission edge.** The first row receives `margin-block-start: auto`, which pushes short history stacks to the bottom of the history area. New guesses therefore appear next to the submission area and visually push older guesses upward; once the area overflows, `HistoryArea` auto-scrolls to the newest row.

**History scrolling snaps by row.** The scroll container uses vertical scroll snap and each row snaps on its block-end edge. This keeps manual review feeling row-by-row instead of free-scrolling between partial guesses while preserving chronological DOM order for accessibility.

**Result tone lookup via `RESULT_TONE` record.** Avoids a `switch` or chain of conditionals while mapping engine result values to shared visual tones owned by `BaseTile`.

**No dispatch or interaction.** HistoryArea is purely display. All state changes originate from Pool and SubmissionArea; HistoryArea only reflects history that has already been committed to state.
