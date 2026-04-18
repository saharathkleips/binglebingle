# components/board

Displays the player's guess history as a grid of evaluated tiles. Read-only — no interactions.

## Exports

- `Board` — renders all past guesses from `useGame()` state; returns `null` when history is empty; no props
- `BoardTile` — single evaluated tile; colored by result (correct / present / absent)
