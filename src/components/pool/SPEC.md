# SPEC: components/pool

**Status:** stable

## Purpose

Renders the fixed-layout jamo pool and handles per-tile interactions. Reads pool state from `useGame()` and dispatches character actions. Pool tile coordinates are not persisted; the layout determines each tile's resting position.

**Boundaries:**

- Reads from: `useGame()` (state.pool)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/lib/character/rotation` for `getNextRotation`, `src/lib/character/composition` for `decompose`, `compose`

## File Map

```
pool/
├── Pool.tsx             # Interaction coordinator — owns tap/drag logic, dispatches actions
├── Pool.module.css      # Flex-wrap layout for pool tiles
├── PoolTile.tsx         # Single tile — GSAP Draggable mechanics, renders isRejected shake
├── PoolTile.module.css  # Pool-specific shake keyframes
├── Pool.test.tsx
├── PoolTile.test.tsx
├── README.md
└── SPEC.md
```

## Functions

### Pool

Reads `state.pool` from `useGame()` and renders a `PoolTile` for each tile. The container reserves at least `--pool-min-visible-rows` rows for the current tile tier so history can grow without stealing the pool's expected visual footprint. Owns all interaction logic:

- **`handleTap(tile)`** — checks `getNextRotation` / `decompose` and dispatches `CHARACTER_ROTATE_NEXT` or `CHARACTER_DECOMPOSE`.
- **`handleDropOnTile(sourceTile, targetId)`** — looks up the target tile, calls `compose()` to validate; dispatches `CHARACTER_COMPOSE` on success or sets `rejectedTileId` on failure.
- **`handleDropOnSlot(sourceTile, slotIndex)`** — dispatches `SUBMISSION_SLOT_INSERT`.
- **`rejectedTileId`** local state — tracks which tile should shake; cleared via `onRejectedEnd` callback.

Computes `isTappable` per tile and passes it as a prop.

### PoolTile

Renders a single tile by composing `CharacterTile` from `src/components/tile`. Owns GSAP Draggable mechanics and delegates tile feedback animation setup to `useTileFeedback` — no character lib imports, no game logic.

**Props:**

- `isTappable: boolean` — drives the `inert` CSS class; when `true`, tap calls `onTap()`.
- `isRejected: boolean` — Pool sets this when a compose operation is rejected; PoolTile renders feedback.
- `onTap: () => void` — called on click when `isTappable`.
- `onDropOnTile: (targetId: number) => void` — called when a drag ends on another tile.
- `onDropOnSlot: (slotIndex: number) => void` — called when a drag ends on a submission slot.
- `canDropOnTarget?: (target: Element) => boolean` — gates valid-drop highlighting while dragging.
- `onRejectedEnd: () => void` — called from `onAnimationEnd`; Pool clears `rejectedTileId`.
- `isRotating`, `isJustComposed`, `isNewlyAdded` — feedback flags owned by Pool and animated through `useTileFeedback`.
- `onRotatingEnd`, `onComposedEnd`, `onNewlyAddedEnd` — completion callbacks that clear Pool feedback state.

**Drag behavior** (GSAP Draggable):

- Draggable owns click-vs-drag differentiation and pointer event wiring.
- `onDragStart`: temporarily allows pool overflow so the tile can travel to slots and plays pickup feedback.
- `onDrag`: resolves the current target via `document.elementsFromPoint`, sets `data-drag-over="true"` on valid targets, and sets `data-can-drop="true"` on the dragged tile.
- `onDragEnd`: dispatches slot/tile callbacks for valid drops, clears inline drag styles when React will re-render/unmount the tile, or animates the tile back to its fixed pool layout position when no valid drop occurred. Invalid drags never leave tiles at arbitrary canvas coordinates.
- Drop onto `data-slot-index` element → `onDropOnSlot(slotIndex)`.
- Drop onto `data-tile-id` element → `onDropOnTile(targetId)`.

## Key Decisions

**PoolTile is callback-only; Pool owns all game logic.** PoolTile does not import `compose`, `getNextRotation`, or `decompose`. The reducer already validates and no-ops on invalid actions; centralizing validity checks in Pool is more honest about ownership and leaves PoolTile as a pure "I exist, I can be interacted with, here's what happened" component.

**`rejectedTileId` in Pool, not `isShaking` in PoolTile.** Moving shake state to Pool lets it be cleared from outside (via `onRejectedEnd`) and avoids PoolTile needing to know what caused the shake.

**`isTappable` computed in Pool and passed as prop.** PoolTile has no knowledge of rotation sets or composition rules; Pool computes the flag once per render using the same lib calls it uses for dispatch.

**Callbacks not context.** PoolTile receives callbacks from Pool rather than calling `useGame()`. This keeps PoolTile testable without wrapping in a provider and avoids redundant context subscriptions per tile.

**Pool positions are fixed by layout.** GSAP Draggable applies temporary transforms during an active drag only. A successful drop dispatches state changes; an invalid drag animates back to `x: 0, y: 0` and clears inline styles so the tile resumes its natural flex-layout position.

**Drag state tracked in refs, not state.** Callback refs, the current tile id, and the last highlighted drop target use refs so Draggable callbacks stay current without re-rendering on every pointer movement.

**`touch-action: none` from BaseTile interactive styles.** Required for drag on touch devices; prevents the browser from claiming the gesture for scrolling before the drag can begin.

**Shared visuals stay in `CharacterTile` / `BaseTile`.** PoolTile attaches GSAP Draggable, refs, test ids, and drop-target data attributes to the shared tile element without importing `resolveCharacter` or duplicating base tile CSS.

**Feedback setup is delegated.** PoolTile keeps drag/drop behavior local but calls `useTileFeedback` for rotate, compose, particle, and entrance animations so the feedback contract stays separate from both shared visuals and Draggable setup.

**`document.elementsFromPoint?.()` with optional chaining.** The API is not implemented in jsdom; optional chaining with a `[]` fallback keeps tests clean without needing a global polyfill.
