# SPEC: components/board

**Status:** draft

## Purpose

Renders the guess history read-only. Each past guess is a row of `BoardTile` components colored by evaluation result.

**Boundaries:**

- Reads from: `useGame()` (state.history)
- Dispatches to: nothing
- Calls into: `src/lib/character` for `resolveCharacter`

## File Map

```
board/
├── Board.tsx             # History container — maps rows to BoardTile grids
├── Board.module.css      # Grid layout for history rows
├── BoardTile.tsx         # Single evaluated tile — display + result coloring
├── BoardTile.module.css  # Tile styling + correct/present/absent color classes
├── Board.test.tsx
├── BoardTile.test.tsx
├── README.md
└── SPEC.md
```

## Functions

### Board

Reads `state.history` from `useGame()`. Returns `null` when history is empty. Renders one `<div>` row per `GuessRecord`, each containing a `BoardTile` per `EvaluatedCharacter`.

### BoardTile

Receives a single `EvaluatedCharacter`. Displays `resolveCharacter(evaluated.character)` or an empty string when no character is present. Applies a CSS class based on `evaluated.result` via `RESULT_CLASS` lookup.

`data-result` attribute mirrors the result value for test selection and potential CSS attribute targeting.

## Key Decisions

**Board returns null, not an empty container.** An empty `<div>` would occupy layout space before any guesses are made. Returning `null` keeps the layout clean on the first turn.

**Result class lookup via `RESULT_CLASS` record.** Avoids a `switch` or chain of conditionals. Falls back to an empty string for any unrecognised result so the tile still renders without crashing.

**No dispatch or interaction.** Board is purely display. All state changes originate from Rack and Composer; Board only reflects history that has already been committed to state.
