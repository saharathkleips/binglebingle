# Architecture

**빙글빙글** — fully client-side, statically-hosted single-page PWA. No backend. No authentication. No runtime network calls except asset loading and the service worker cache.

## Layer Diagram

```
┌──────────────────────────────────────────────────┐
│                    UI LAYER                      │
│               src/components/                    │
│  Token pool · Submission slots · Guess board     │
│  Modals · App shell                              │
└──────────────────┬───────────────────────────────┘
                   │ reads state + dispatches actions
                   │ via useGame() context hook
┌──────────────────▼───────────────────────────────┐
│                 STATE LAYER                      │
│                 src/state/                       │
│  useReducer(gameReducer) + GameContext           │
└──────────────────┬───────────────────────────────┘
                   │ pure function calls only
┌──────────────────▼───────────────────────────────┐
│             DOMAIN LOGIC LAYER                   │
│   src/lib/jamo/       src/lib/character/         │
│   src/lib/word/       src/lib/engine/            │
│   No React. No I/O. Fully unit-testable.         │
└──────────────────────────────────────────────────┘
```

## Layer Responsibilities

**`src/lib/jamo/`** — Unicode mechanics: rotation, jamo combination, syllable composition/decomposition, index tables. Zero game knowledge. See `src/lib/jamo/README.md`.

**`src/lib/character/`** — The `Character` discriminated union and its operations: factory, compose, resolve, decompose, isComplete. The bridge between raw jamo and the player-visible slot model. See `src/lib/character/README.md`.

**`src/lib/word/`** — Word type, jamo decomposition and pool derivation, word loading and selection. The only domain layer that performs I/O (`fetch`). See `src/lib/word/README.md`.

**`src/lib/engine/`** — Game rules: guess validation (can this guess be constructed from the pool?), guess evaluation (correct / present / absent per character), scoring. See `src/lib/engine/README.md`.

**`src/state/`** — Single `useReducer` + `GameContext`. Reducer enforces valid state transitions; engine computes what those transitions mean. UI accesses state only via `useGame()`. See `src/state/README.md`.

**`src/components/`** — Renders state, dispatches actions. No business logic. See `src/components/README.md`.

## Key Decisions

| Decision                                   | Rationale                                                                                                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/` has zero React imports          | Pure domain logic is fully unit-testable in isolation; no component harness needed                                                                       |
| Reducer does not evaluate guesses          | `SUBMIT_GUESS` receives a pre-computed `GuessRecord` from the engine. Separates "what states are reachable" (reducer) from "what a state means" (engine) |
| `won` is derived, never stored             | Avoids stale derived state — computed from the last `GuessRecord` at read time                                                                           |
| No `status` field on `GameState`           | Application layer decides whether a game is active by controlling what it renders                                                                        |
| Pool resets fully after each guess         | Simplifies validation — engine treats the pool as fresh for every submission                                                                             |
| Pool is tokens, not raw jamo               | `PoolToken = { id, character }` — stable ids let UI track drag/drop identity across state updates                                                        |
| Submissions hold token ids, not characters | The character in a slot is always derived from the pool token — no duplicate state                                                                       |
| UI accesses state only via `useGame()`     | Typed wrapper hook; `useContext` never called directly in components                                                                                     |
| Static hosting, no backend                 | GitHub Pages — no server, no auth, no DB. All game logic is in-browser                                                                                   |
| No hard guess limit at MVP                 | Designer decision — may be added post-MVP                                                                                                                |
| Difficulty is a UI concern only            | Derived from word length at render time; never stored on the word or game state                                                                          |

## Non-Goals

| Out of scope                          | Reason                             |
| ------------------------------------- | ---------------------------------- |
| Multiplayer / shared sessions         | No backend                         |
| User accounts / leaderboards          | No backend                         |
| Server-side guess validation          | Static only                        |
| Animated jamo rotation effects        | UX iteration deferred              |
| Accessibility / screen reader support | Post-MVP                           |
| Internationalization                  | Post-MVP                           |
| Archaic / historical jamo             | Out of modern Hangul scope         |
| Complex jamo as given pool items      | Always constructed from basic jamo |
| Mobile-native app                     | Web-first                          |
| NIKL corpus integration               | Hand-curated word list for MVP     |
