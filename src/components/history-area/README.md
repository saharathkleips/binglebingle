# components/history-area

Displays the player's guess history as a grid of evaluated tiles. Read-only — no interactions.

## Exports

- `HistoryArea` — renders all past guesses from `useGame()` state; returns `null` when history is empty; no props
- `HistoryTile` — single evaluated tile; colored by result (correct / present / absent)
