# SPEC: components

## Purpose

Component structure, interaction model, and data flow for the game UI.

**Boundaries:**

- Reads from: `useGame()` (state)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/lib/engine/` for `canSubmit`, `evaluateGuess`; `src/lib/character/` for `resolveCharacter`; `src/lib/jamo/` for `getNextRotation`
- No direct state mutation

Visual design and styling are deferred — components render functionally correct with minimal styling for MVP. Exception: tile shake animation is required for MVP to confirm invalid combine attempts.

## Conventions

**File structure order:** imports → types → file-local constants → component → sub-components → helpers.

**Context:** never call `useContext` directly — always use `useGame()` from `GameContext.tsx`.

**Memoization:** React 19 + React Compiler handles this automatically — no speculative `useMemo` or `useCallback`.

**Styling:** CSS Modules only — each component has a colocated `ComponentName.module.css` file. Global design tokens (colors, spacing, font sizes) and base resets live in `src/index.css` as CSS custom properties. No inline `style` props except for values that must be computed at runtime (e.g. dynamic widths). Apply multiple classes via template literals or `clsx`.
