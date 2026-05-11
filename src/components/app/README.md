# components/app

Root component — composes the full game UI and owns top-level layout, game initialization, viewport support messaging, and win state presentation.

## Exports

- `App` — root component. Always renders the game shell with minimum tile hitboxes and lets the responsive flex layout use whatever viewport space is available. Add `?tilePreview=1` to open a dev-only full-app visual preview with iframe-sized breakpoint buttons.
- `TilePreview` — static full-app preview used inside the tile preview iframe; covers four history rows, seven submission slots, and a worst-case 42-tile pool without game context or interactions.
