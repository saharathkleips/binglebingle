# SPEC: components/pool

**Status:** draft

## Purpose

Renders the jamo pool and handles per-tile interactions. Reads pool state from `useGame()` and dispatches character actions.

**Boundaries:**

- Reads from: `useGame()` (state.pool)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/lib/character/rotation` for `getNextRotation`, `src/lib/character/composition` for `decompose`

## File Map

```
pool/
├── Pool.tsx             # Pool container — maps tiles to Tile components
├── Pool.module.css      # Flex-wrap layout for pool tiles
├── Tile.tsx             # Single tile — tap handler, shake animation
├── Tile.module.css      # Tile styling + shake keyframes
├── Pool.test.tsx
├── Tile.test.tsx
├── README.md
└── SPEC.md
```

## Functions

### Pool

Reads `state.pool` from `useGame()` and renders a `Tile` for each tile. Passes `dispatch` and the full `pool` down to each Tile.

### Tile

Renders a single tile. Display text comes from `resolveCharacter(tile.character)`.

**Tap behavior** (determined at render time):

1. `getNextRotation(tile.character) !== null` → rotatable → dispatch `CHARACTER_ROTATE_NEXT`
2. `decompose(tile.character) !== null` → decomposable → dispatch `CHARACTER_DECOMPOSE`
3. Neither → inert (drag only)

**Drag behavior** (Pointer Events, no library):

- `pointerdown`: record start position.
- `pointermove`: if cumulative movement ≥ 4 px, enter drag mode; capture pointer; create a ghost `div` at cursor; highlight the element under the pointer via `data-drag-over="true"`.
- `pointerup`: resolve drop target via `document.elementsFromPoint`; dispatch appropriate action; clean up ghost and highlights.
- Drop onto `data-slot-index` element → `SUBMISSION_SLOT_INSERT`.
- Drop onto `data-tile-id` element → call `compose()` to validate; if valid dispatch `CHARACTER_COMPOSE`, if invalid trigger `isShaking`.
- `pointercancel`: clean up ghost and highlights without dispatching.

**Shake animation:** local `isShaking` boolean state. Set to `true` when a Tile→Tile drop is invalid (compose returns null). Reset via `onAnimationEnd`. Drives a CSS `.shaking` class.

**Drag suppression of tap:** a `wasDragRef` ref is set to `true` at the end of a drag so the synthetic `click` event that follows `pointerup` is discarded.

## Key Decisions

**Dispatch and pool passed as props, not from context.** Tile receives `dispatch` and `pool` from Pool rather than calling `useGame()`. This keeps Tile testable without wrapping in a provider and avoids redundant context subscriptions per tile.

**`pool` is optional (defaults to `[]`).** Existing tests and usages that don't exercise compose don't need to supply it.

**Drag state tracked in refs, not state.** Only `isDragging` (visual opacity) and `isShaking` use `useState`; everything else (start position, ghost element, last highlighted target) uses refs to avoid re-renders on every `pointermove`.

**Compose validity checked in Tile before dispatch.** Tile calls `compose()` directly to determine if a Tile→Tile drop is valid. This avoids needing to compare state before/after dispatch to detect a reducer no-op, and enables the immediate shake feedback.

**`touch-action: none` on Tile.** Required for Pointer Events drag to work on touch devices; prevents the browser from claiming the gesture for scrolling before pointer capture can be established.

**`document.elementsFromPoint?.()` with optional chaining.** The API is not implemented in jsdom; optional chaining with a `[]` fallback keeps tests clean without needing a global polyfill.
