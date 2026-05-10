# SPEC: components/app

**Status:** draft

## Purpose

`App` is the root component. It owns game initialization, top-level layout, viewport support messaging, and win state presentation. `GameProvider` wraps the entire tree here — all child components read state via `useGame()`.

**Boundaries:**

- Calls into: `src/lib/puzzle/` for `setupGame`; `src/lib/engine/` for `isWon`, `calculateScore`
- Renders: `HistoryArea`, `SubmissionArea`, `Pool`
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

**Viewport support:**

Screens below the documented minimum game viewport (`375px × 667px`) show a CSS-only unsupported message. The game shell is hidden with media queries rather than JavaScript measurement so tile tier selection and viewport support remain native CSS concerns.

**Loading / Instructions:**

Shows `InstructionsScreen` while `setupGame()` resolves — game is typically ready by the time the player dismisses it.

**Win State:**

`isWon(state)` derived from the last `GuessRecord` (all `'correct'`). On win:

- Pool area replaced by score (`calculateScore(state.history)`) and target word
- HistoryArea remains visible — final guess row shows all-correct tiles
- SubmissionButton becomes a Share placeholder (inert in MVP)
- No separate results screen — game area transforms in place

**Dev panel:**

Dev settings live in `App` local state; dev panel accessible via `?dev=1` URL param (MVP only).

## Key Decisions

**`GameProvider` wraps the entire app.** All game state lives in context; child components read via `useGame()`. `App` is the only place `GameProvider` is instantiated.

**`setupGame()` called on mount.** The async puzzle fetch starts immediately; `InstructionsScreen` covers the load time so the player never sees a blank game state.

**Unsupported viewport is CSS-only.** App markup includes both the unsupported message and supported game shell. `App.module.css` switches between them at `375px × 667px`, matching the first tile tier in `src/index.css` and avoiding JavaScript viewport measurement.

## Open Questions

- Should `InstructionsScreen` be a route or an overlay? Current assumption is an overlay that dismisses on tap.
- Win state transform is in-place for MVP — is a dedicated results screen needed for a later milestone?
