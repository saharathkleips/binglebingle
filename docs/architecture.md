# architecture.md

> Jamo Word Game — System Architecture
> Last updated: revision 3 (locked)

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

All game logic — puzzle loading, guess evaluation, jamo rotation, composition — executes entirely in the browser.

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
│   Actions: START_GAME | ROTATE_JAMO | COMBINE_JAMO          │
│            COMPOSE_CHARACTER | REMOVE_JAMO | SUBMIT_GUESS   │
│            CLEAR_DRAFT | RESET_GAME                         │
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
│  src/lib/jamo/jamo-data.ts  — all jamo defs, rotation sets, │
│                               composition rules              │
└──────────────────────────────────────────────────────────────┘
```

---

## The Korean Jamo Model

This section is foundational. The coding agent must implement it exactly as specified.

### Scope of Modern Hangul Jamo

The game uses only **modern hangul jamo**. Archaic jamo are excluded entirely.

**Basic consonants (14):** ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ
**Double consonants (5):** ㄲ ㄸ ㅃ ㅆ ㅉ
**Basic vowels (10):** ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ
**Complex vowels / diphthongs (11):** ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ

---

### Core Mechanic: Rotate → Combine → Compose

The central creative loop of the game is:

1. **Rotate** a jamo from the pool into a different jamo within its equivalence set
2. **Combine** two jamo tokens to form a more complex jamo
3. **Compose** a set of jamo (choseong + jungseong + optional jongseong) into a syllable block

These three operations are independent and can be applied in sequence. A player may rotate a jamo _then_ combine the result — this is intentional and is one of the primary sources of puzzle depth. The engine must apply them in this order when validating a guess: first check whether all jamo used can be derived (via rotation and/or combination) from the pool, then check that syllable composition rules are satisfied.

---

### Rotation Rules

Rotation is modeled as **equivalence sets**. Any jamo in a set can become any other member of that set. There is no ordering or directionality in the data model — the UX layer decides how to cycle (e.g. clockwise on tap).

```typescript
// src/lib/jamo/jamo-data.ts
export const ROTATION_SETS: readonly (readonly string[])[] = [
  ["ㄱ", "ㄴ"],
  ["ㅏ", "ㅓ", "ㅗ", "ㅜ"],
  ["ㅣ", "ㅡ"],
  ["ㅑ", "ㅕ", "ㅛ", "ㅠ"],
];
```

A jamo not appearing in any set cannot be rotated. Lookup signature:

```typescript
// Returns all jamo this one can become (excluding itself), or []
export function getRotationOptions(jamo: string): string[];
```

---

### Composition Rules

Jamo can be **combined** to form more complex jamo. Combination takes two jamo tokens and produces one new jamo. It is mechanically distinct from rotation.

#### 1. Double consonants (쌍자음)

| Input   | Output |
| ------- | ------ |
| ㄱ + ㄱ | ㄲ     |
| ㄷ + ㄷ | ㄸ     |
| ㅂ + ㅂ | ㅃ     |
| ㅅ + ㅅ | ㅆ     |
| ㅈ + ㅈ | ㅉ     |

#### 2. Complex vowels (복합모음)

| Input        | Output | Constituent atoms |
| ------------ | ------ | ----------------- |
| ㅏ + ㅣ      | ㅐ     | ㅏ ㅣ             |
| ㅑ + ㅣ      | ㅒ     | ㅑ ㅣ             |
| ㅓ + ㅣ      | ㅔ     | ㅓ ㅣ             |
| ㅕ + ㅣ      | ㅖ     | ㅕ ㅣ             |
| ㅗ + ㅏ      | ㅘ     | ㅗ ㅏ             |
| ㅗ + ㅏ + ㅣ | ㅙ     | ㅗ ㅏ ㅣ          |
| ㅗ + ㅣ      | ㅚ     | ㅗ ㅣ             |
| ㅜ + ㅓ      | ㅝ     | ㅜ ㅓ             |
| ㅜ + ㅓ + ㅣ | ㅞ     | ㅜ ㅓ ㅣ          |
| ㅜ + ㅣ      | ㅟ     | ㅜ ㅣ             |
| ㅡ + ㅣ      | ㅢ     | ㅡ ㅣ             |

**Key rule**: A composed complex vowel is simply a valid vowel. The Composer does not distinguish between "basic" and "complex" vowels in the jungseong slot — it only cares that the token in that slot is a valid vowel jamo. A complex vowel may also be decomposed back into its constituents by the player.

ㅙ and ㅞ are composed of **three atomic vowels** and combination is **associative** — both bracketing orders produce the same result:

- ㅙ = ㅗ + ㅏ + ㅣ: player may form `(ㅗ + ㅏ) + ㅣ` = `ㅘ + ㅣ`, or `ㅗ + (ㅏ + ㅣ)` = `ㅗ + ㅐ`
- ㅞ = ㅜ + ㅓ + ㅣ: player may form `(ㅜ + ㅓ) + ㅣ` = `ㅝ + ㅣ`, or `ㅜ + (ㅓ + ㅣ)` = `ㅜ + ㅔ`

Since UX forces binary operations (only two tokens can be combined at once), an intermediary step is always required regardless of path. The Composer must support staging an intermediate composed vowel before the next combination step.

#### 3. Compound batchim (겹받침)

**Only valid in jongseong (final consonant) position.** Cannot appear as choseong.

| Input   | Output |
| ------- | ------ |
| ㄱ + ㅅ | ㄳ     |
| ㄴ + ㅈ | ㄵ     |
| ㄴ + ㅎ | ㄶ     |
| ㄹ + ㄱ | ㄺ     |
| ㄹ + ㅁ | ㄻ     |
| ㄹ + ㅂ | ㄼ     |
| ㄹ + ㅅ | ㄽ     |
| ㄹ + ㅌ | ㄾ     |
| ㄹ + ㅍ | ㄿ     |
| ㄹ + ㅎ | ㅀ     |
| ㅂ + ㅅ | ㅄ     |

---

### Syllable Block Composition

Korean syllable blocks are composed from:

- **Choseong (초성)**: initial consonant — required
- **Jungseong (중성)**: vowel — required
- **Jongseong (종성)**: final consonant — optional

Unicode composition formula:

```
syllableCodepoint = 0xAC00
  + (choseongIndex × 21 + jungseongIndex) × 28
  + jongseongIndex
```

The choseong index table and jongseong index table are **different orderings** — a jamo's choseong index ≠ its jongseong index. Both tables must be hardcoded in `jamo-data.ts`.

**Orthographic rule**: A syllable block cannot begin with a vowel. If the intended initial position is a vowel sound, the silent consonant ㅇ (ieung) must be used as choseong.

---

## Domain Boundaries

### `src/lib/jamo/` — Korean Linguistics Core

- All jamo definitions, Unicode codepoints, choseong/jongseong index tables
- Rotation equivalence sets and `getRotationOptions()`
- Combination rules: `combineJamo()`, `decomposeJamo()`
- Syllable block: `composeSyllable(choseong, jungseong, jongseong?)`, `decomposeSyllable(syllable)`

**Zero knowledge of game rules.**

---

### `src/lib/engine/` — Game Rules

- **Validation**: given a guess (array of syllable blocks) and the pool, confirm every character is constructible from the pool via rotation and/or combination. Pool is treated as fully reset for each guess. Submission need not be a real word; it need not use all available jamo.
- **Evaluation**: given a guess and the target word, return per-character `TileResult` (`"green" | "yellow" | "gray"`)
- **Scoring**: given guess count, return score

**Zero knowledge of UI or state shape.**

---

### `src/lib/puzzle/` — Puzzle Data

- `Puzzle` type (target word, jamo pool, word length — no difficulty field)
- `loadPuzzles()` — fetches `public/data/puzzles.json`
- `selectPuzzle(puzzles, strategy)` — date-seed or random
- Difficulty is a **UI/presentation concern only** — derived from word length (3 → easy, 4 → medium, 5 → hard) and never stored on the puzzle. The UI layer maps `wordLength` to a display label.

---

### `src/state/` — Game State Machine

Single `useReducer` + `Context`. Pool is immutable canonical state, never mutated during guess construction. Draft state is ephemeral, reset on submit/cancel.

---

### `src/components/` — UI

- **Rack**: jamo pool display; tap to rotate (cycle through rotation set), drag to Composer
- **Composer**: syllable assembly area; assign jamo to choseong/jungseong/jongseong slots; supports combining jamo within the working area and decomposing composed jamo back into constituents
- **Board**: guess history grid with tile coloring
- **Modals**: HowToPlay, Results/Score

---

## CI/CD and Code Quality

All quality gates run in GitHub Actions before merge and before deployment.

### Pipeline: `.github/workflows/ci.yml`

```
on: push (all branches) + pull_request

jobs:
  quality:
    - oxlint         # lint (fast Rust-based ESLint-compatible linter)
    - oxfmt check    # formatting check (Rust-based, Prettier-compatible)
    - tsc --noEmit   # type checking

  test:
    - vitest run     # unit tests (domain logic only at MVP)

  build:
    - vite build     # production build

deploy:
  needs: [quality, test, build]
  if: branch == main
  - Upload dist/ to GitHub Pages via actions/deploy-pages
```

### Pipeline: `.github/workflows/deploy.yml`

Deployment uses the official `actions/deploy-pages` action targeting GitHub Pages. No separate `gh-pages` branch is maintained — the Pages source is set to **GitHub Actions** in the repo settings.

### Tooling

Package manager: **pnpm**. All install commands use `pnpm add`.

```jsonc
// devDependencies (representative — pin exact versions at scaffold time)
{
  "oxlint": "...", // linting
  "oxfmt": "...", // formatting (standard npm package — pnpm add -D oxfmt)
  "vitest": "...", // unit tests (domain logic)
  "playwright": "...", // e2e tests
  "typescript": "...",
}
```

### Pipeline: `.github/workflows/ci.yml`

```
on: push (all branches) + pull_request

jobs:
  quality:
    - oxlint             # lint
    - oxfmt --check      # format check
    - tsc --noEmit       # type check

  test:
    - vitest run         # unit tests (src/lib/)
    - playwright test    # e2e tests

  build:
    - vite build         # production build

deploy:
  needs: [quality, test, build]
  if: branch == main
  - Upload dist/ to GitHub Pages via actions/deploy-pages
```

### Pipeline: `.github/workflows/deploy.yml`

Deployment uses the official `actions/deploy-pages` action. No separate `gh-pages` branch is maintained — the Pages source is set to **GitHub Actions** in the repo settings.

| Decision                                         | Rationale                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| Rotate → combine → compose as ordered operations | Core game mechanic; validation must check in this order                     |
| Rotation as equivalence sets                     | Simple lookup, designer-controlled, UX-agnostic                             |
| Composition separate from rotation               | Mechanically distinct; conflating them breaks validation                    |
| Pool resets each guess                           | Specified; simplifies validation and state                                  |
| Composed vowels are just vowels                  | Composer is position-aware, not type-aware; no special casing needed        |
| Pure domain logic (`src/lib/` has no React)      | Fully unit-testable in isolation                                            |
| `useReducer` + Context                           | Small action set; explicit typing aids coding agent                         |
| Jamo pool as frequency map                       | O(1) availability checks during validation                                  |
| `@dnd-kit/core` for drag-and-drop                | Touch/pointer sensors; works on iOS Safari                                  |
| `vite-plugin-pwa`                                | Workbox SW from config; no manual SW authoring                              |
| GitHub Actions + `actions/deploy-pages`          | No separate gh-pages branch; cleaner deployment model                       |
| oxlint + oxfmt                                   | Fast Rust-based quality tools; enforced in CI before merge and deploy       |
| Difficulty derived from word length (UI only)    | No difficulty field on `Puzzle`; UI maps wordLength → label                 |
| pnpm as package manager                          | Specified; consistent with modern TS project conventions                    |
| Vitest (unit) + Playwright (e2e)                 | Vitest for pure domain logic; Playwright for full browser interaction flows |
| Date-seeded daily puzzle                         | Consistent Wordle-like daily experience; dev mode adds overrides            |
| No hard guess limit (MVP)                        | Designer decision; may be added post-MVP via config                         |

---

## Non-Goals (explicit, for this MVP)

| Out of scope                                | Reason                                                     |
| ------------------------------------------- | ---------------------------------------------------------- |
| Multiplayer / shared sessions               | No backend                                                 |
| User accounts / leaderboards                | No backend                                                 |
| Animated jamo rotation (visual spin effect) | UX iteration deferred                                      |
| Server-side puzzle validation               | Static only                                                |
| Accessibility / screen reader support       | Post-MVP pass                                              |
| Internationalization                        | Post-MVP                                                   |
| Archaic / historical jamo                   | Out of modern hangul scope                                 |
| Complex/compound jamo as _given_ pool items | Always constructed from basic jamo; never in starting pool |
| Hard guess limit                            | No maximum guesses in MVP; may add post-MVP                |
| NIKL corpus integration                     | Post-MVP; hand-curated word list used to start             |

---

## File Structure

```
/
├── .github/
│   └── workflows/
│       ├── ci.yml            # lint, fmt-check, typecheck, test, build
│       └── deploy.yml        # deploy to GitHub Pages on main
├── public/
│   ├── data/
│   │   └── puzzles.json
│   ├── icons/
│   └── manifest.webmanifest
├── src/
│   ├── lib/
│   │   ├── jamo/
│   │   │   ├── jamo-data.ts      # jamo defs, index tables, rotation sets, combination rules
│   │   │   ├── rotation.ts       # getRotationOptions()
│   │   │   └── composition.ts    # combineJamo(), decomposeJamo(), composeSyllable(), decomposeSyllable()
│   │   ├── engine/
│   │   │   ├── evaluate.ts       # evaluateGuess()
│   │   │   ├── validate.ts       # isGuessValid()
│   │   │   └── scoring.ts        # calculateScore()
│   │   └── puzzle/
│   │       ├── loader.ts         # loadPuzzles(), selectPuzzle()
│   │       └── types.ts          # Puzzle, Difficulty
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

## Resolved Decisions (no further input needed)

| #   | Decision                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------- |
| A1  | Rotation = equivalence sets; UX cycles clockwise                                                                     |
| A2  | Pool resets fully between guesses                                                                                    |
| A3  | Word length 3/4/5 by difficulty (easy/medium/hard); extensible                                                       |
| A4  | Compound batchim valid in jongseong only                                                                             |
| A5  | Hand-curated word list for MVP; NIKL integration post-MVP                                                            |
| A6  | Date-seeded daily puzzle; dev mode supports random/date-override                                                     |
| A7  | No hard guess limit in MVP                                                                                           |
| A8  | ㅙ/ㅞ are three-atom vowels; combination is associative — both bracketing paths valid; Composer stages intermediates |
| A9  | Rotate-then-combine confirmed as core game mechanic                                                                  |
