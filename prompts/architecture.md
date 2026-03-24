# architecture.md
> Jamo Word Game — System Architecture

---

## What This Document Covers

High-level system design, layer boundaries, key technical decisions with rationale, and explicit non-goals. This is the authoritative reference for "why things are structured the way they are."

---

## System Overview

A fully client-side, statically-hosted single-page PWA. No backend. No authentication. No network calls at runtime except for asset loading and the service worker cache.

```
User ──► GitHub Pages (static assets)
              │
              ▼
        index.html + JS bundle
              │
              ▼
        React SPA (in-browser)
        ├── UI Layer
        ├── State Layer
        └── Domain Logic Layer
```

All game logic — puzzle loading, guess evaluation, jamo rotation — executes entirely in the browser.

---

## Layer Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        UI LAYER                              │
│                                                              │
│  <Rack />         <Composer />        <Board />             │
│  (available       (build a            (guess history +       │
│   jamo pool)       character           evaluation results)   │
│                    from jamo)                                │
│                                                              │
│  <GameShell />  <ResultsModal />  <HowToPlayModal />        │
└────────────────────────┬─────────────────────────────────────┘
                         │ reads/dispatches via Context
┌────────────────────────▼─────────────────────────────────────┐
│                     STATE LAYER                              │
│                                                              │
│   GameContext  +  useReducer(gameReducer, initialState)      │
│                                                              │
│   Actions: START_GAME | COMPOSE_CHARACTER | REMOVE_JAMO     │
│            SUBMIT_GUESS | CLEAR_DRAFT | RESET_GAME          │
└────────────────────────┬─────────────────────────────────────┘
                         │ pure function calls
┌────────────────────────▼─────────────────────────────────────┐
│                   DOMAIN LOGIC LAYER  (pure TS)              │
│                                                              │
│  src/lib/jamo/          src/lib/engine/    src/lib/puzzle/  │
│  ├── jamo-data.ts       ├── evaluate.ts    ├── loader.ts    │
│  ├── rotation.ts        ├── validate.ts    └── types.ts     │
│  └── composition.ts     └── scoring.ts                      │
│                                                              │
│  No React imports. No side effects. Fully unit-testable.    │
└────────────────────────┬─────────────────────────────────────┘
                         │ imports
┌────────────────────────▼─────────────────────────────────────┐
│                    ASSET / DATA LAYER                        │
│                                                              │
│  public/data/puzzles.json   — puzzle definitions             │
│  src/lib/jamo/jamo-data.ts  — jamo defs + rotation graph    │
└──────────────────────────────────────────────────────────────┘
```

---

## Domain Boundaries

### `src/lib/jamo/` — Korean Linguistics Core

Responsible for everything that is a fact about the Korean writing system:

- The 14 base consonants and 10 base vowels and their Unicode codepoints
- The rotation graph: which jamo can be derived from which by rotation
- **Character composition**: given a choseong (초성) + jungseong (중성) + optional jongseong (종성), produce the correct Unicode syllable block (U+AC00–U+D7A3)
- **Character decomposition**: given a syllable block, return its constituent choseong / jungseong / jongseong

The Unicode composition formula is:
```
syllable = 0xAC00 + (choseong_index × 21 + jungseong_index) × 28 + jongseong_index
```

This module has **zero knowledge of game rules**. It knows about language, not about guessing.

---

### `src/lib/engine/` — Game Rules

Responsible for:

- **Validation**: given a submitted guess (array of syllable blocks) and the current jamo pool, confirm every character in the guess is constructible from the available (possibly rotated) jamo, and that the collective jamo cost does not exceed the pool
- **Evaluation**: given a guess and the target word, return per-character `Tile` results (`"green" | "yellow" | "gray"`)
- **Scoring**: given the number of guesses taken, return a score

This module knows about game rules but has **zero knowledge of UI or state shape**.

---

### `src/lib/puzzle/` — Puzzle Data

Responsible for:

- The `Puzzle` type definition (target word, available jamo pool, word length, optional metadata)
- Loading a puzzle from the static JSON bundle (by index, by date hash, or randomly)
- Validating that a puzzle's jamo pool is internally consistent (i.e., the target word can actually be spelled from the pool using rotations)

---

### `src/state/` — Game State Machine

A single `useReducer` + `Context`. All UI reads from context; all mutations go through dispatched actions. No component holds authoritative game state.

---

### `src/components/` — UI

Pure React components. Receive data via props or context. Dispatch actions. No business logic.

Sub-domains within UI:
- **Rack**: displays the available jamo pool; tracks which jamo are currently "in use" in the draft
- **Composer**: the working area where the player builds one character at a time by assigning jamo to choseong / jungseong / jongseong slots. This is where the drag-and-drop UX lives.
- **Board**: renders the guess history as a grid of colored tiles
- **Modals**: HowToPlay, Results/Score

---

## Key Technical Decisions

### 1. Pure domain logic layer (no React in `src/lib/`)
**Why**: The jamo composition and game evaluation logic is complex and must be unit-tested in isolation. Mixing it with React lifecycle makes testing painful and the 9B downstream agent more likely to produce bugs. Every function in `src/lib/` should be importable in a Node.js test runner with no mocking.

### 2. `useReducer` + `Context` (not Zustand or Redux)
**Why**: The state shape is simple (one active game at a time) and the action set is small and well-defined. Adding a state library is an unnecessary dependency. `useReducer` forces explicit action typing which aids the coding agent.

### 3. Jamo pool modeled as a frequency map, not an array
**Why**: The pool `{ ㄱ: 3, ㅏ: 3, ㅎ: 1, ㅇ: 1 }` makes it O(1) to check availability and decrement. An array of strings would require repeated filtering.

### 4. Rotations modeled as a directed adjacency list
**Why**: Rotation is not necessarily symmetric or transitive. `ㅏ` rotates into `ㅜ`, `ㅓ`, and `ㅗ` — but does `ㅜ` rotate back into `ㅏ`? This is a game design question (see Assumptions). The adjacency list `{ ㅏ: [ㅜ, ㅓ, ㅗ], ㄱ: [ㄴ], ... }` keeps the designer in control without requiring the engine to infer anything.

### 5. Puzzle data as static JSON on `public/data/puzzles.json`
**Why**: No backend needed. The file is fetched once, cached by the service worker, and never changes at runtime. Puzzle selection (daily / random) is computed client-side from the array index.

### 6. `@dnd-kit/core` for drag-and-drop
**Why**: It has first-class support for pointer and touch sensors (critical for mobile), is actively maintained, and separates drag logic from rendering. React DnD is older and HTML5-drag-API-based (broken on iOS). Native touch handling from scratch is fragile.

### 7. Vite + `vite-plugin-pwa`
**Why**: Generates a Workbox-based service worker from config with no manual SW writing. Handles precache manifest, asset versioning, and offline strategy automatically.

### 8. GitHub Pages deployment via `gh-pages` branch
**Why**: `vite build` output goes to `dist/`. A CI step (GitHub Actions) pushes `dist/` to the `gh-pages` branch. `vite.config.ts` must set `base: '/<repo-name>/'`.

---

## Non-Goals (explicit, for this MVP)

| Out of scope | Reason |
|---|---|
| Multiplayer or shared puzzles | No backend |
| User accounts or leaderboards | No backend |
| Compound jamo (ㄳ, ㄵ, ㅘ, ㅝ, etc.) | Significant added complexity; revisit post-MVP |
| Double consonants (ㄲ, ㄸ, ㅃ, ㅆ, ㅉ) | Same — post-MVP |
| Animated jamo rotation (visual spin) | UX iteration deferred |
| Server-side puzzle validation | Static only |
| Accessibility / screen reader support | Post-MVP pass |
| Internationalization (UI in English and Korean) | Post-MVP |

---

## File Structure (top level)

```
/
├── public/
│   ├── data/
│   │   └── puzzles.json          # puzzle definitions
│   ├── icons/                    # PWA icons
│   └── manifest.webmanifest
├── src/
│   ├── lib/
│   │   ├── jamo/
│   │   │   ├── jamo-data.ts      # consonant/vowel defs + rotation graph
│   │   │   ├── rotation.ts       # getRotations(), canRotateTo()
│   │   │   └── composition.ts    # compose(), decompose()
│   │   ├── engine/
│   │   │   ├── evaluate.ts       # evaluateGuess()
│   │   │   ├── validate.ts       # isGuessValid()
│   │   │   └── scoring.ts        # calculateScore()
│   │   └── puzzle/
│   │       ├── loader.ts         # loadPuzzle(), selectPuzzle()
│   │       └── types.ts          # Puzzle type
│   ├── state/
│   │   ├── GameContext.tsx
│   │   ├── gameReducer.ts
│   │   └── types.ts              # GameState, GameAction
│   ├── components/
│   │   ├── Rack/
│   │   ├── Composer/
│   │   ├── Board/
│   │   └── modals/
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   └── lib/                      # unit tests for pure domain logic
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## ⚑ Assumptions — Review Before Handing to Agent

The following are decisions I made that are not stated in the brief. **Each one needs your explicit sign-off.**

---

**A1 — Rotation graph direction (MUST REVIEW)**

I'm modeling rotation as a directed graph. The current proposal is that rotation is **one-directional from the base jamo**:

- `ㄱ → ㄴ` (but ㄴ is NOT listed as rotating to anything by default)
- `ㅏ → ㅓ, ㅗ, ㅜ` (but ㅓ/ㅗ/ㅜ don't rotate to anything)

This means the player's pool is expressed in "base" jamo only, and the player decides how to rotate them. If you want rotation to be bidirectional or chained (e.g., ㄱ→ㄴ→ㄷ→...), the graph definition in `jamo-data.ts` needs to reflect that. **Please provide or approve the complete rotation mapping before implementation.**

---

**A2 — Jamo pool consumption model (MUST REVIEW)**

My reading of the example: jamo are consumed when used. If you have `{ ㄱ: 3 }` and use two to form `국` (ㄱ as choseong + rotated-to-ㄱ as jongseong), you have 1 ㄱ remaining for that guess. A guess does **not** need to use all available jamo — you can submit a guess with fewer characters than the target word length.

**Please confirm this is correct.** Alternative reading: the pool resets between guesses (jamo are never permanently consumed). The implementation differs significantly.

---

**A3 — Word length per puzzle (MUST REVIEW)**

The example shows 3 characters. I'm assuming word length is fixed per puzzle (defined in the puzzle JSON), not globally fixed. So puzzles might be 2–5 characters, and each puzzle declares its own `wordLength`.

---

**A4 — Compound jamo are out of scope (flagged as Non-Goal)**

I'm treating ㄳ, ㅘ, ㄵ etc. as entirely out of scope. If a target word requires a compound final consonant (받침), that puzzle would not be included in the word list. Confirm this is acceptable.

---

**A5 — Word list source**

No word list source was specified. Possible options:
- A curated hand-authored list of N-syllable common nouns
- A subset of the [NIKL (국립국어원) public corpus](https://corpus.korean.go.kr/) — verify license
- Custom list authored by you

**The word list must be finalized before puzzle generation can work.** I'm treating it as a black box for now; the architecture doesn't care where it comes from.

---

**A6 — Puzzle selection strategy**

I'm assuming a **date-seeded daily puzzle** (one puzzle per calendar day, same for all players — like Wordle) with a fallback to random for development. If you want something different (random every session, user-selectable difficulty), the `selectPuzzle()` function signature needs to change.

---

**A7 — Guess count and "losing"**

The brief describes scoring by guess count but doesn't mention a maximum number of guesses (i.e., a lose condition). I'm assuming there is a maximum (6 is the Wordle convention). If the game should never end in failure, the state machine needs adjustment.

---
