# SPEC: components/pool

**Status:** draft

## Purpose

Renders the jamo pool and handles per-tile interactions. Reads pool state from `useGame()` and dispatches character actions.

**Boundaries:**

- Reads from: `useGame()` (state.pool)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/lib/character/rotation` for `getNextRotation`, `src/lib/character/composition` for `decompose`, `compose`

## File Map

```
pool/
├── Pool.tsx             # Interaction coordinator — owns tap/drag logic, dispatches actions
├── Pool.module.css      # Flex-wrap layout for pool tiles
├── Tile.tsx             # Single tile — pointer/drag mechanics, renders isInvalid shake
├── Tile.module.css      # Tile styling + shake keyframes
├── Pool.test.tsx
├── Tile.test.tsx
├── README.md
└── SPEC.md
```

## Functions

### Pool

Reads `state.pool` from `useGame()` and renders a `Tile` for each tile. Owns all interaction logic:

- **`handleTap(tile)`** — checks `getNextRotation` / `decompose` and dispatches `CHARACTER_ROTATE_NEXT` or `CHARACTER_DECOMPOSE`.
- **`handleDropOnTile(sourceTile, targetId)`** — looks up the target tile, calls `compose()` to validate; dispatches `CHARACTER_COMPOSE` on success or sets `invalidTileId` on failure.
- **`handleDropOnSlot(sourceTile, slotIndex)`** — dispatches `SUBMISSION_SLOT_INSERT`.
- **`invalidTileId`** local state — tracks which tile should shake; cleared via `onInvalidStateEnd` callback.

Computes `isTappable` per tile and passes it as a prop.

### Tile

Renders a single tile. Display text comes from `resolveCharacter(tile.character)`.
Owns pointer/drag mechanics only — no lib imports, no game logic.

**Props:**

- `isTappable: boolean` — drives the `inert` CSS class; when `true`, tap calls `onTap()`.
- `isInvalid: boolean` — Pool sets this when a compose operation fails; Tile renders the shake animation.
- `onTap: () => void` — called on click when `isTappable`.
- `onDropOnTile: (targetId: number) => void` — called when a drag ends on another tile.
- `onDropOnSlot: (slotIndex: number) => void` — called when a drag ends on a submission slot.
- `onInvalidStateEnd: () => void` — called from `onAnimationEnd`; Pool clears `invalidTileId`.

**Drag behavior** (Pointer Events, no library):

- `pointerdown`: record start position.
- `pointermove`: if cumulative movement ≥ 4 px, enter drag mode; capture pointer; create a ghost `div` at cursor; highlight the element under the pointer via `data-drag-over="true"`.
- `pointerup`: resolve drop target via `document.elementsFromPoint`; call `onDropOnSlot` or `onDropOnTile`; clean up ghost and highlights.
- Drop onto `data-slot-index` element → `onDropOnSlot(slotIndex)`.
- Drop onto `data-tile-id` element → `onDropOnTile(targetId)`.
- `pointercancel`: clean up ghost and highlights without calling any callback.

**Drag suppression of tap:** a `wasDragRef` ref is set to `true` at the end of a drag so the synthetic `click` event that follows `pointerup` is discarded.

## Key Decisions

**Tile is callback-only; Pool owns all game logic.** Tile no longer imports `compose`, `getNextRotation`, or `decompose`. The reducer already validates and no-ops on invalid actions; centralizing validity checks in Pool is more honest about ownership and leaves Tile as a pure "I exist, I can be interacted with, here's what happened" component.

**`invalidTileId` in Pool, not `isShaking` in Tile.** Moving shake state to Pool lets it be cleared from outside (via `onInvalidStateEnd`) and avoids Tile needing to know what caused the shake.

**`isTappable` computed in Pool and passed as prop.** Tile has no knowledge of rotation sets or composition rules; Pool computes the flag once per render using the same lib calls it uses for dispatch.

**Callbacks not context.** Tile receives callbacks from Pool rather than calling `useGame()`. This keeps Tile testable without wrapping in a provider and avoids redundant context subscriptions per tile.

**Drag state tracked in refs, not state.** Only `isDragging` (visual opacity) uses `useState`; everything else (start position, ghost element, last highlighted target) uses refs to avoid re-renders on every `pointermove`.

**`touch-action: none` on Tile.** Required for Pointer Events drag to work on touch devices; prevents the browser from claiming the gesture for scrolling before pointer capture can be established.

**`document.elementsFromPoint?.()` with optional chaining.** The API is not implemented in jsdom; optional chaining with a `[]` fallback keeps tests clean without needing a global polyfill.
