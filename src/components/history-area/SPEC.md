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
├── HistoryTile.module.css      # History-owned CSS hook; shared tile visuals live in tile/BaseTile.module.css
├── HistoryArea.test.tsx
├── HistoryTile.test.tsx
├── README.md
└── SPEC.md
```

## Functions

### HistoryArea

Reads `state.history` from `useGame()`. Returns `null` when history is empty. Renders one `<div>` row per `GuessRecord`, each containing a `HistoryTile` per `EvaluatedCharacter`.

### HistoryTile

Receives a single `EvaluatedCharacter`. Renders `CharacterTile` when a character is present, or `BaseTile` with empty content when no character is present. Applies the shared `BaseTile` tone through a `RESULT_TONE` lookup so `CORRECT`, `PRESENT`, and `ABSENT` keep their visual variants without duplicating tile surface CSS.

`data-result` attribute mirrors the result value for test selection and potential CSS attribute targeting. History tiles remain inert and do not attach pool or submission interaction behavior.

## Key Decisions

**HistoryArea returns null, not an empty container.** An empty `<div>` would occupy layout space before any guesses are made. Returning `null` keeps the layout clean on the first turn.

**Result tone lookup via `RESULT_TONE` record.** Avoids a `switch` or chain of conditionals while mapping engine result values to shared visual tones owned by `BaseTile`.

**No dispatch or interaction.** HistoryArea is purely display. All state changes originate from Pool and SubmissionArea; HistoryArea only reflects history that has already been committed to state.
