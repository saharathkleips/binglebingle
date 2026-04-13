# SPEC: Components

**Status:** draft
**Slice:** `src/components/`

## Purpose

Component structure, interaction model, and data flow for the game UI.

**Boundaries:**

- Reads from: `useGame()` (state)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/lib/engine/` for `canSubmit`, `evaluateGuess`; `src/lib/character/` for `resolveCharacter`; `src/lib/jamo/` for `getNextRotation`
- No direct state mutation

Visual design and styling are deferred — components render functionally correct with minimal styling for MVP. Exception: token shake animation (U6) is required for MVP to confirm invalid combine attempts.

## Component Tree

```
App
├── NavBar
├── InstructionsScreen   [shown on first load and on demand]
└── GameProvider
    └── Game
        ├── Board
        │   └── GuessRow (× guesses.length)
        │       └── EvaluatedTile (× word length)
        ├── SubmissionRow
        │   └── SubmissionSlot (× word length)
        ├── Pool                     [transforms to win state when isWon]
        │   └── Token (× pool.length)
        └── Controls
            ├── SubmitButton         [becomes Share placeholder when won]
            └── ResetButton
```

## File Map

```
src/
├── App.tsx
└── components/
    ├── NavBar.tsx
    ├── InstructionsScreen.tsx
    ├── Game.tsx
    ├── Board/
    │   ├── Board.tsx
    │   ├── GuessRow.tsx
    │   └── EvaluatedTile.tsx
    ├── SubmissionRow/
    │   ├── SubmissionRow.tsx
    │   └── SubmissionSlot.tsx
    ├── Pool/
    │   └── Pool.tsx
    ├── Token/
    │   └── Token.tsx
    └── Controls/
        ├── Controls.tsx
        ├── SubmitButton.tsx
        └── ResetButton.tsx
```

## App

Starts `setupGame()` on mount. Shows `InstructionsScreen` while loading — game is typically ready by the time the player dismisses it. Dev settings live in `App` local state; dev panel accessible via `?dev=1` URL param.

## Token Interaction Model

Token is the core interactive element. Only appears in the pool.

**Tap:**

- Rotatable single-jamo → `ROTATE_TOKEN` (cycles via `getNextRotation`)
- Non-rotatable / multi-jamo → `SPLIT_TOKEN` (one step via `decomposeJamo`)
- Basic non-rotatable, non-splittable → inert to taps (drag only)

**Drag:**

- Onto another pool token → validity check first (`combineJamo` or `upgradeJongseong`); if valid → `COMBINE_TOKENS`; if invalid → shake animation, no dispatch
- Onto empty submission slot → `PLACE_TOKEN`
- Onto filled submission slot → no-op (MVP)

**Shake animation:** local `shaking` boolean state on `Token`. Set to `true` on invalid combine, reset via `onAnimationEnd`. Drives a CSS shake class. Required for MVP.

## SubmissionSlot Interaction

- **Empty slot**: drop target — accepts dragged tokens, dispatches `PLACE_TOKEN`
- **Filled slot**: tap → `REMOVE_FROM_SLOT`; drag token back toward pool → `REMOVE_FROM_SLOT`
- Slots are both drop targets and drag sources

## Submit Flow

```
SubmitButton click
  → canSubmit(state.submission)        // check validity
  → evaluateGuess(state.submission, state.word)  // compute result
  → dispatch SUBMIT_GUESS              // reducer records it
```

## Win State

`isWon(state)` derived from last GuessRecord (all `'correct'`). On win:

- Pool area shows score (`calculateScore(state.guesses)`) and target word
- Board remains visible — final guess row shows all-correct tiles (effectively reveals the word)
- SubmitButton becomes Share placeholder (inert in MVP)

## Key Decisions

**U1 — Tap a rotatable token → rotate** (cycles via `getNextRotation`)
**U2 — Drag token onto another token → combine** (validity checked pre-dispatch)
**U3 — Tap a non-rotatable / multi-jamo token → split** (one step)
**U4 — Drag token onto empty slot → place**
**U5 — Incomplete tokens may be placed in slots** — `canSubmit` gates submission
**U6 — Invalid combine → shake animation** — CSS only, required for MVP
**U7 — No separate results screen** — game area transforms in place on win
**U8 — Drag threshold prevents accidental drags on tap** — `@dnd-kit` pointer/touch sensor activation distance
