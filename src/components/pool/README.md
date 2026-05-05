# components/pool

Displays the player's jamo pool as interactive tiles. Tap to rotate or decompose; drag to combine or place.

## Exports

- `Pool` — renders all pool tiles from `useGame()` state; no props
- `Tile` — single pool tile; owns GSAP Draggable mechanics; all game logic lives in Pool
