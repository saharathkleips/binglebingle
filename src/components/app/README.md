# components/app

Root component — composes the full game UI and owns top-level layout, game initialization, viewport support messaging, and win state presentation.

## Exports

- `App` — root component. Always renders the game shell with minimum tile hitboxes and lets the responsive flex layout use whatever viewport space is available. Add `?tilePreview=1` to open a dev-only full-app visual preview with iframe-sized breakpoint buttons and tile font options.
- `TilePreview` — full-app preview used inside the tile preview iframe; mounts the real game layout/components with a deterministic preview `GameState` covering four history rows, seven submission slots, and a worst-case 42-tile pool. Accepts an optional `fontOption` for manual tile typography checks.
- `TilePreviewFontOption` — font metadata used by the preview shell to load an optional stylesheet URL and set the tile font family and weight.
