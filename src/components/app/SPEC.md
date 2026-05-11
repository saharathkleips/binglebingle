# SPEC: components/app

**Status:** draft

## Purpose

`App` is the root component. It owns game initialization, top-level layout, and win state presentation. `GameProvider` wraps the entire tree here — all child components read state via `useGame()`.

**Boundaries:**

- Calls into: `src/lib/puzzle/` for `setupGame`; `src/lib/engine/` for `isWon`, `calculateScore`
- Renders: `HistoryArea`, `SubmissionArea`, `Pool`
- No direct state mutation

## File Map

```
app/
├── App.tsx
├── App.module.css
├── App.test.tsx
├── TilePreview.tsx
├── TilePreview.module.css
├── README.md
└── SPEC.md
```

## Functions

### App

Initializes the game via `setupGame()` on mount and renders the full game UI.

**Viewport support:**

The game shell always renders. Minimum tile hitbox tokens are defined unconditionally in `src/index.css`; larger viewport media queries progressively enhance the tile scale. Very small or unusual viewports may clip naturally instead of showing a separate unsupported screen.

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

**Tile preview:**

`?tilePreview=1` renders a manual preview screen instead of the game shell. It uses an iframe whose `width` and `height` attributes are changed by breakpoint buttons, so the existing viewport media queries in `src/index.css` are exercised without resizing the browser. `?tilePreview=frame` renders `TilePreview`, a static full-app mock with four evaluated history rows, seven submission slots, and a worst-case 42-tile pool. The mock avoids `GameProvider` and interaction hooks so visual iteration stays isolated from gameplay behavior.

## Key Decisions

**`GameProvider` wraps the entire app.** All game state lives in context; child components read via `useGame()`. `App` is the only place `GameProvider` is instantiated.

**`setupGame()` called on mount.** The async puzzle fetch starts immediately; `InstructionsScreen` covers the load time so the player never sees a blank game state.

**Always render the game shell.** The app keeps the minimum `44px` tile hitbox as the default token set and relies on flex layout to use whatever viewport space is available. This avoids rejecting narrow-but-tall or short-but-wide screens that can still be playable; if content clips, it clips naturally rather than being blocked by an unsupported screen.

**Tile preview is an iframe, not a fake token override.** The preview screen changes iframe dimensions instead of setting CSS variables or data attributes. This keeps manual iteration honest: the same viewport media queries select tile tiers in preview and in the real game. The iframe content mirrors the full app layout but uses static visual data, including mixed history results and the maximum pool tile count, to keep the preview deterministic and lightweight.

## Open Questions

- Should `InstructionsScreen` be a route or an overlay? Current assumption is an overlay that dismisses on tap.
- Win state transform is in-place for MVP — is a dedicated results screen needed for a later milestone?
