# architecture.md
> Jamo Word Game — System Architecture
> Last updated: revision 2

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

The game uses only **modern hangul jamo** from the Hangul Jamo Unicode block. Archaic jamo are excluded entirely.

**Basic consonants (14):** ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ
**Double consonants (5):** ㄲ ㄸ ㅃ ㅆ ㅉ
**Basic vowels (10):** ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ
**Complex vowels / diphthongs (11):** ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ

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

A jamo not appearing in any set cannot be rotated. Lookup:

```typescript
// Returns all jamo this one can become (excluding itself), or []
export function getRotationOptions(jamo: string): string[]
```

---

### Composition Rules

Jamo can be **combined** to form more complex jamo. Composition is distinct from rotation — it takes two jamo tokens and produces one new jamo. Three combination types exist:

#### 1. Double consonants (쌍자음)
Two identical basic consonants combine into one double consonant:

| Input    | Output |
|----------|--------|
| ㄱ + ㄱ | ㄲ     |
| ㄷ + ㄷ | ㄸ     |
| ㅂ + ㅂ | ㅃ     |
| ㅅ + ㅅ | ㅆ     |
| ㅈ + ㅈ | ㅉ     |

#### 2. Complex vowels (복합모음)
Two basic or already-composed vowels combine:

| Input      | Output |
|------------|--------|
| ㅏ + ㅣ   | ㅐ     |
| ㅑ + ㅣ   | ㅒ     |
| ㅓ + ㅣ   | ㅔ     |
| ㅕ + ㅣ   | ㅖ     |
| ㅗ + ㅏ   | ㅘ     |
| ㅗ + ㅐ   | ㅙ     |
| ㅗ + ㅣ   | ㅚ     |
| ㅜ + ㅓ   | ㅝ     |
| ㅜ + ㅔ   | ㅞ     |
| ㅜ + ㅣ   | ㅟ     |
| ㅡ + ㅣ   | ㅢ     |

Note: ㅙ = ㅗ + ㅐ and ㅞ = ㅜ + ㅔ. Since ㅐ = ㅏ+ㅣ and ㅔ = ㅓ+ㅣ, these are two-step compositions. The player must form the intermediate vowel first (see A8 below).

#### 3. Compound batchim (겹받침)
Two consonants combine into a compound final consonant. **Only valid in jongseong (final consonant) position.**

| Input      | Output |
|------------|--------|
| ㄱ + ㅅ   | ㄳ     |
| ㄴ + ㅈ   | ㄵ     |
| ㄴ + ㅎ   | ㄶ     |
| ㄹ + ㄱ   | ㄺ     |
| ㄹ + ㅁ   | ㄻ     |
| ㄹ + ㅂ   | ㄼ     |
| ㄹ + ㅅ   | ㄽ     |
| ㄹ + ㅌ   | ㄾ     |
| ㄹ + ㅍ   | ㄿ     |
| ㄹ + ㅎ   | ㅀ     |
| ㅂ + ㅅ   | ㅄ     |

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

**Orthographic rule**: A syllable block cannot begin with a vowel. If the player's intended initial sound is a vowel, the silent consonant ㅇ (ieung) must be used as choseong.

---

## Domain Boundaries

### `src/lib/jamo/` — Korean Linguistics Core

- All jamo definitions, Unicode codepoints, choseong/jongseong index tables
- Rotation equivalence sets and `getRotationOptions()`
- Combination rules: `combineJamo()`, double consonants, complex vowels, compound batchim
- Syllable block composition: `composeSyllable(choseong, jungseong, jongseong?)`
- Syllable block decomposition: `decomposeSyllable(syllable)` → `{ choseong, jungseong, jongseong }`

**Zero knowledge of game rules.**

---

### `src/lib/engine/` — Game Rules

- **Validation**: given a guess (array of syllable blocks) and the pool, confirm every character is constructible from the pool (using rotations and combinations), treating the pool as fully reset. No character in the guess needs to exist as a "real word."
- **Evaluation**: given a guess and the target word, return per-character `TileResult` (`"green" | "yellow" | "gray"`)
- **Scoring**: given guess count, return score

**Zero knowledge of UI or state shape.**

---

### `src/lib/puzzle/` — Puzzle Data

- `Puzzle` type
- `loadPuzzles()` — fetches `public/data/puzzles.json`
- `selectPuzzle(puzzles, strategy)` — returns one puzzle by date-seed or random
- Build-time validation: target word reachable from pool

---

### `src/state/` — Game State Machine

Single `useReducer` + `Context`. Pool is immutable canonical state; never mutated during guess construction. Draft state is ephemeral and reset on submit/cancel.

---

### `src/components/` — UI

- **Rack**: jamo pool display; tap to rotate, drag to Composer
- **Composer**: syllable assembly area; assign jamo to slots, combine jamo within slots
- **Board**: guess history grid with tile coloring
- **Modals**: HowToPlay, Results/Score

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| Rotation as equivalence sets | Simple lookup, designer-controlled, UX-agnostic |
| Composition as separate operation from rotation | Mechanically distinct; conflating them breaks validation logic |
| Pool resets each guess | Specified; simplifies validation and state |
| Pure domain logic layer (`src/lib/` has no React) | Unit-testable in isolation |
| `useReducer` + Context | Small action set; explicit typing aids coding agent |
| Jamo pool as frequency map | O(1) availability checks |
| `@dnd-kit/core` | Touch/pointer sensor support; works on iOS Safari |
| `vite-plugin-pwa` | Workbox SW generated from config; no manual SW authoring |
| GitHub Pages via `gh-pages` branch | `vite.config.ts` must set `base: '/<repo-name>/'` |

---

## Non-Goals (explicit, for this MVP)

| Out of scope | Reason |
|---|---|
| Multiplayer / shared sessions | No backend |
| User accounts / leaderboards | No backend |
| Animated jamo rotation (visual spin effect) | UX iteration deferred |
| Server-side puzzle validation | Static only |
| Accessibility / screen reader support | Post-MVP pass |
| Internationalization | Post-MVP |
| Archaic / historical jamo | Out of modern hangul scope |
| Complex/compound jamo as *given* pool items | Always constructed from basic jamo; never in starting pool |

---

## File Structure

```
/
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
│   │   │   └── composition.ts    # combineJamo(), composeSyllable(), decomposeSyllable()
│   │   ├── engine/
│   │   │   ├── evaluate.ts       # evaluateGuess()
│   │   │   ├── validate.ts       # isGuessValid()
│   │   │   └── scoring.ts        # calculateScore()
│   │   └── puzzle/
│   │       ├── loader.ts
│   │       └── types.ts
│   ├── state/
│   │   ├── GameContext.tsx
│   │   ├── gameReducer.ts
│   │   └── types.ts
│   ├── components/
│   │   ├── Rack/
│   │   ├── Composer/
│   │   ├── Board/
│   │   └── modals/
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   └── lib/
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## ⚑ Open Assumptions — Answer Before Proceeding

**A3 — Word length per puzzle**
Assuming word length is fixed per puzzle and declared in the puzzle JSON. Puzzles may vary in length (e.g. 2–5 characters). Confirm?

**A4 — Compound batchim position constraint**
Compound batchim (ㄳ, ㄵ, etc.) are valid only in jongseong position. They cannot appear as choseong. This matches Korean orthographic rules. Confirm?

**A5 — Word list source**
No word list was specified. A decision is needed before `plan-puzzle.md`. Options: hand-curated, NIKL corpus subset (license check needed), or your own authored list.

**A6 — Puzzle selection strategy**
Assuming date-seeded daily puzzle (same puzzle for all players on a given day), with random fallback for development. Confirm or specify alternative.

**A7 — Maximum guesses / lose condition**
The brief specifies scoring by guess count but no maximum. Is there a hard limit (e.g. 6 guesses) after which the game ends in failure? Or is the game endless until the player guesses correctly?

**A8 — Two-step complex vowel UX**
ㅙ and ㅞ require two composition steps (e.g. ㅗ + (ㅏ+ㅣ)). The Composer must support holding an intermediate composed vowel before it's used in a syllable. Flagging now so it's deliberately designed in `plan-composer.md`.

**A9 — Rotation then combination**
Can a player rotate a jamo and then combine it? E.g. rotate ㄱ→ㄴ, then combine ㄴ+ㅈ→ㄵ? Assuming **yes**. Confirm?
