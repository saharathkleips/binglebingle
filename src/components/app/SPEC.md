# SPEC: components/app

**Status:** draft

## Purpose

`App` is the root component. It owns game initialization, top-level layout, and win state presentation. `GameProvider` wraps the entire tree here — all child components read state via `useGame()`.

**Boundaries:**

- Calls into: `src/lib/puzzle/` for `setupGame`; `src/lib/engine/` for `isWon`, `calculateScore`
- Renders: `Board`, `Composer`, `Rack`
- No direct state mutation

## File Map

```
app/
├── App.tsx
├── App.test.ts
├── README.md
└── SPEC.md
```

## Functions

### App

Initializes the game via `setupGame()` on mount and renders the full game UI.

**Loading / Instructions:**

Shows `InstructionsScreen` while `setupGame()` resolves — game is typically ready by the time the player dismisses it.

**Win State:**

`isWon(state)` derived from the last `GuessRecord` (all `'correct'`). On win:

- Pool area replaced by score (`calculateScore(state.history)`) and target word
- Board remains visible — final guess row shows all-correct tiles
- SubmitButton becomes a Share placeholder (inert in MVP)
- No separate results screen — game area transforms in place

**Dev panel:**

Dev settings live in `App` local state; dev panel accessible via `?dev=1` URL param (MVP only).

## Key Decisions

**`GameProvider` wraps the entire app.** All game state lives in context; child components read via `useGame()`. `App` is the only place `GameProvider` is instantiated.

**`setupGame()` called on mount.** The async puzzle fetch starts immediately; `InstructionsScreen` covers the load time so the player never sees a blank game state.

## Open Questions

- Should `InstructionsScreen` be a route or an overlay? Current assumption is an overlay that dismisses on tap.
- Win state transform is in-place for MVP — is a dedicated results screen needed for a later milestone?
