# SPEC: components

**Status:** draft

## Purpose

Component structure, interaction model, and data flow for the game UI.

**Boundaries:**

- Reads from: `useGame()` (state)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/lib/engine/` for `canSubmit`, `evaluateGuess`; `src/lib/character/` for `resolveCharacter`; `src/lib/jamo/` for `getNextRotation`
- No direct state mutation

Visual design and styling are deferred — components render functionally correct with minimal styling for MVP. Exception: token shake animation is required for MVP to confirm invalid combine attempts.

## Conventions

**File structure order:** imports → types → file-local constants → component → sub-components → helpers.

**Context:** never call `useContext` directly — always use `useGame()` from `GameContext.tsx`.

**Memoization:** React 19 + React Compiler handles this automatically — no speculative `useMemo` or `useCallback`.

**Styling:** CSS Modules only — each component has a colocated `ComponentName.module.css` file. Global design tokens (colors, spacing, font sizes) and base resets live in `src/index.css` as CSS custom properties. No inline `style` props except for values that must be computed at runtime (e.g. dynamic widths). Apply multiple classes via template literals or `clsx` — no `tailwind-merge` needed.

## Interactions

### Token

Token is the core interactive element. Only appears in the pool.

**Tap:**

- Rotatable single-jamo → `ROTATE_TOKEN` (cycles via `getNextRotation`)
- Non-rotatable / multi-jamo → `SPLIT_TOKEN` (one step via `decomposeJamo`)
- Basic non-rotatable, non-splittable → inert to taps (drag only)

**Drag:**

- Onto another pool token → validity check first (`combineJamo` or `upgradeJongseong`); if valid → `COMBINE_TOKENS`; if invalid → shake animation, no dispatch
- Onto empty submission slot → `PLACE_TOKEN`
- Onto filled submission slot → no-op (MVP)

**Shake animation:** local `shaking` boolean state on `Token`. Set to `true` on invalid combine, reset via `onAnimationEnd`. Drives a CSS shake class. Required for MVP to confirm invalid combine attempts.

**Drag threshold:** A 4px movement threshold is enforced in the `dragstart` handler before activating drag state, preventing accidental drags on tap. This is implemented via `pointerdown` + `pointermove` tracking rather than relying on a library sensor.

### SubmissionSlot

- **Empty slot**: drop target — accepts dragged tokens, dispatches `PLACE_TOKEN`
- **Filled slot**: tap → `REMOVE_FROM_SLOT`; drag token back toward pool → `REMOVE_FROM_SLOT`
- Slots are both drop targets and drag sources
- Drop targets set `dragover` to `preventDefault()` to allow drops; visual drop feedback via a CSS class toggled on `dragenter`/`dragleave`

### Submit

```
SubmitButton click
  → canSubmit(state.submission)        // check validity
  → dispatch ROUND_SUBMISSION_SUBMIT   // reducer evaluates and records
```

Incomplete tokens may be placed in slots — `canSubmit` gates submission rather than blocking placement.

### Win State

`isWon(state)` derived from last GuessRecord (all `'correct'`). On win:

- Pool area shows score (`calculateScore(state.history)`) and target word
- Board remains visible — final guess row shows all-correct tiles (effectively reveals the word)
- SubmitButton becomes Share placeholder (inert in MVP)
- No separate results screen — game area transforms in place on win

## Key Decisions

App starts `setupGame()` on mount. Shows `InstructionsScreen` while loading — game is typically ready by the time the player dismisses it. Dev settings live in `App` local state; dev panel accessible via `?dev=1` URL param.
