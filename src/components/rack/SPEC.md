# SPEC: components/rack

**Status:** draft

## Purpose

Renders the jamo pool and handles per-tile interactions. Reads pool state from `useGame()` and dispatches character actions.

**Boundaries:**

- Reads from: `useGame()` (state.pool)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/lib/character/rotation` for `getNextRotation`, `src/lib/character/composition` for `decompose`

## File Map

```
rack/
├── Rack.tsx             # Pool container — maps tiles to Token components
├── Rack.module.css      # Flex-wrap layout for pool tiles
├── Token.tsx            # Single tile — tap handler, shake animation
├── Token.module.css     # Tile styling + shake keyframes
├── Rack.test.tsx
├── Token.test.tsx
├── README.md
└── SPEC.md
```

## Functions

### Rack

Reads `state.pool` from `useGame()` and renders a `Token` for each tile. Passes `dispatch` down to each Token.

### Token

Renders a single tile. Display text comes from `resolveCharacter(tile.character)`.

**Tap behavior** (determined at render time):

1. `getNextRotation(tile.character) !== null` → rotatable → dispatch `CHARACTER_ROTATE_NEXT`
2. `decompose(tile.character) !== null` → decomposable → dispatch `CHARACTER_DECOMPOSE`
3. Neither → inert (no click handler)

**Shake animation:** local `isShaking` boolean state. Set to `true` on invalid combine (wired in UI-04), reset via `onAnimationEnd`. Drives a CSS `.shaking` class.

## Key Decisions

**Dispatch passed as prop, not called from context.** Token receives `dispatch` as a prop from Rack rather than calling `useGame()` itself. This keeps Token testable without wrapping in a provider and avoids redundant context subscriptions per tile.

**Tap action selection happens in the component.** The component checks `getNextRotation` and `decompose` to decide which action to dispatch. This is interaction-boundary logic, not business logic — the reducer still validates and may no-op.
