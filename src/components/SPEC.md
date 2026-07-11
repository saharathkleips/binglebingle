# SPEC: components

## Purpose

Component structure, interaction model, and data flow for the game UI.

**Boundaries:**

- Reads from: `useGame()` (state)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/lib/engine/` for `canSubmit`, `evaluateGuess`; `src/lib/character/` for `resolveCharacter`; `src/lib/jamo/` for `getNextRotation`
- No direct state mutation

Visual design uses shared tile, button, and animation primitives rather than one-off component effects. Invalid combine attempts use the shared drag snap-back motion; there is no separate tile shake animation.

## Conventions

**File structure order:** imports → types → file-local constants → component → sub-components → helpers.

**Context:** never call `useContext` directly — always use `useGame()` from `GameContext.tsx`.

**Memoization:** React 19 + React Compiler handles this automatically — no speculative `useMemo` or `useCallback`.

**Styling:** CSS Modules only — each component has a colocated `ComponentName.module.css` file. Global design tokens (colors, spacing, font sizes, shared gradients, semantic overlay/drop-feedback colors) and base resets live in `src/index.css` as CSS custom properties. Tile tokens can scale with viewport tiers; shared button depth tokens stay fixed so navigation and submit controls do not inherit larger game-piece shadows, while both elevation systems remain thematically linked through shared colors, shadow construction, and motion behavior. No inline `style` props except for values that must be computed at runtime (e.g. dynamic widths). Apply conditional classes with `clsx`.
