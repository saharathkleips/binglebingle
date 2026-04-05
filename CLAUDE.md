# CLAUDE.md
> Jamo Word Game — Agent Reference
> Keep this file under 200 lines. Do not add implementation detail here — point to the plan docs instead.

---

## What This Project Is

A single-player Korean word-guessing game. The player is given a pool of basic Korean jamo (자모) and must construct Korean syllable characters (글자) to guess a hidden word. Jamo can be rotated into related jamo and combined to form complex vowels, double consonants, and compound final consonants. The game evaluates each submitted character as correct (right position), present (wrong position), or absent.

---

## Tech Stack

| Tool | Role |
|---|---|
| TypeScript (strict) | Language — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| React 19 | UI — React Compiler enabled, no manual memoization |
| Tailwind CSS | Styling — utility classes only, no custom CSS files except `src/index.css` |
| Vite | Build tool — `base` must be set to `'/<repo-name>/'` for GitHub Pages |
| `vite-plugin-pwa` | Service worker + PWA manifest |
| `@dnd-kit/core` | Drag and drop — pointer and touch sensors |
| pnpm | Package manager — never use npm or yarn |
| Vitest | Unit tests — colocated with source files |
| Playwright | E2E tests — lives in `tests/` at repo root |
| oxlint + oxfmt | Linting and formatting — enforced in CI |
| GitHub Actions | CI/CD — quality gates before merge, deploy to GitHub Pages on main |

---

## File Structure

```
/
├── .github/workflows/
│   ├── ci.yml              # lint, fmt-check, typecheck, test, build
│   └── deploy.yml          # deploy to GitHub Pages on main
├── public/data/
│   └── words.json          # hand-curated word list for MVP
├── src/
│   ├── lib/
│   │   ├── jamo/           # Unicode tables, rotation sets, combination rules
│   │   │   ├── jamo-data.ts
│   │   │   ├── rotation.ts
│   │   │   └── composition.ts
│   │   ├── character/      # Character type, resolveCharacter(), isComplete()
│   │   │   ├── types.ts
│   │   │   └── character.ts
│   │   ├── word/           # Word branded type, derivePool(), normalizePool()
│   │   │   ├── types.ts    # Word, WordSelectionStrategy
│   │   │   └── word.ts
│   │   ├── engine/         # canSubmit(), evaluateGuess(), calculateScore()
│   │   │   ├── types.ts    # CharacterResult, EvaluatedCharacter, GuessRecord
│   │   │   ├── validate.ts
│   │   │   ├── evaluate.ts
│   │   │   └── scoring.ts
│   │   └── game/           # loadWords(), selectWord(), setupGame()
│   │       ├── loader.ts
│   │       └── setup.ts
│   ├── state/
│   │   ├── types.ts        # GameState, GameAction, PoolToken, SubmissionState
│   │   ├── game-reducer.ts # gameReducer(), createInitialGameState()
│   │   └── GameContext.tsx # GameProvider, useGame()
│   ├── components/
│   │   ├── NavBar.tsx
│   │   ├── InstructionsScreen.tsx
│   │   ├── Game.tsx
│   │   ├── Board/          # Board, GuessRow, EvaluatedTile
│   │   ├── SubmissionRow/  # SubmissionRow, SubmissionSlot
│   │   ├── Pool/           # Pool
│   │   ├── Token/          # Token (pool only)
│   │   └── Controls/       # Controls, SubmitButton, ResetButton
│   ├── App.tsx
│   └── main.tsx
└── tests/                  # Playwright e2e tests only
```

Unit tests are colocated: `src/lib/jamo/rotation.test.ts` lives next to `rotation.ts`.

---

## Hard Constraints

**Korean Unicode**: all jamo in application code use **Hangul Compatibility Jamo (U+3130–U+318F)**. Verify: `'ㄱ'.codePointAt(0) === 0x3131`. The Hangul Jamo block (U+1100–U+11FF) is only used internally inside `composeSyllable` / `decomposeSyllable` via the index tables — never stored or compared directly.

**Pure domain logic**: nothing under `src/lib/` may import React. No side effects except `src/lib/game/loader.ts` which calls `fetch`. Every exported function in `src/lib/` must have an explicit return type and a colocated test.

**Reducer is pure**: `gameReducer` has no async, no side effects, no calls to `fetch`. `SUBMIT_GUESS` receives a pre-computed `GuessRecord` in its payload — evaluation happens in the UI before dispatch.

**Invalid actions are no-ops**: the reducer returns state unchanged for any action whose preconditions are not met. The UI is responsible for only dispatching valid actions.

**No path aliases**: use relative imports. No `@/` or `~/` configured.

**No barrel files**: import directly from the file containing the export.

**pnpm only**: all install and run commands use pnpm.

---

## Key Domain Concepts

**Character (글자)**: `{ jamo: readonly string[] }` — an ordered list of 1–3 jamo. Complete when `resolveCharacter` returns a syllable block (U+AC00–U+D7A3).

**Pool token**: `{ id: number; character: Character }` — a draggable tile in the pool. `id` is its stable index into the original pool array.

**Rotation**: equivalence sets — any member can become any other. Sets defined in `ROTATION_SETS`. Tap a rotatable token to cycle via `getNextRotation`.

**Combination**: pairwise — two tokens combine into one via `combineJamo` (double consonants, complex vowels) or `upgradeJongseong` (compound batchim, only when token already has choseong + jungseong + single jongseong). Check validity before dispatching; invalid combine → shake animation, no dispatch.

**Pool reset after guess**: `'correct'` submission slots remain filled. `'present'` and `'absent'` tokens return to pool as-is. Unplaced pool tokens are unchanged.

---

## Plan Documents

Read these in order before implementing a domain. Each document specifies types, function signatures, implementation steps, gotchas, and required test cases.

| Document | Covers |
|---|---|
| `plan-models.md` | All types and state shape — read first |
| `plan-jamo.md` | Unicode tables, rotation, combination, `resolveCharacter` |
| `plan-word.md` | `Word` type, `derivePool`, `normalizePool`, `decomposeJamo` |
| `plan-engine.md` | `canSubmit`, `evaluateGuess`, `calculateScore` |
| `plan-game.md` | `gameReducer`, `GameContext`, `setupGame`, `loadWords` |
| `plan-ui.md` | Component tree, interaction model, data flow |
| `architecture.md` | System overview, layer boundaries, CI/CD, non-goals |
| `conventions.md` | Naming, imports, patterns, anti-patterns |

<!-- GSD:project-start source:PROJECT.md -->
## Project

**빙글빙글 (Binglebingle)**

A single-player Korean word-guessing game for anyone who knows Hangul — primarily native speakers, but playable by learners with solid jamo knowledge. The player is given a pool of basic Korean jamo (자모) and must construct Korean syllable characters (글자) by rotating jamo into related forms, combining them into double consonants or complex vowels, and composing them into complete syllable blocks. Each submitted guess is evaluated character-by-character as correct (right position), present (wrong position), or absent.

Fully client-side PWA deployed to GitHub Pages. No backend, no auth, no accounts.

**Core Value:** The jamo manipulation mechanic — rotate, combine, compose — must feel intuitive and satisfying. If that loop breaks or confuses, the game fails.

### Constraints

- **Tech stack**: TypeScript (strict) + React 19 + Tailwind CSS + Vite + dnd-kit — fixed by architecture docs
- **Package manager**: pnpm — never npm or yarn
- **Hosting**: GitHub Pages (static, no backend possible)
- **Unicode**: Hangul Compatibility Jamo only in application code; Hangul Jamo block used only internally in compose/decompose
- **Purity**: `src/lib/` has no React imports; domain logic is fully unit-testable in isolation
- **Reducer**: pure — no async, no side effects; `SUBMIT_GUESS` receives pre-computed `GuessRecord`
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
